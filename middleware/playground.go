package middleware

import (
	"errors"
	"fmt"
	"net"
	"net/http"
	"strconv"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/constant"
	"github.com/QuantumNous/new-api/i18n"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/service"
	"github.com/QuantumNous/new-api/setting/ratio_setting"
	"github.com/QuantumNous/new-api/types"

	"github.com/gin-gonic/gin"
	"github.com/tidwall/gjson"
)

const playgroundSelectedTokenContextKey = "playground_selected_token"

type playgroundImageFormRequest struct {
	Model   string `json:"model"`
	Group   string `json:"group"`
	TokenId string `json:"token_id"`
}

type playgroundImageRequestMeta struct {
	Model   string
	Group   string
	TokenId int
}

func isPlaygroundImagePath(path string) bool {
	return strings.HasPrefix(path, "/pg/images/generations") ||
		strings.HasPrefix(path, "/pg/images/edits")
}

func isPlaygroundResponsesPath(path string) bool {
	return strings.HasPrefix(path, "/pg/responses")
}

func parsePlaygroundImageRequestMeta(c *gin.Context) (*playgroundImageRequestMeta, error) {
	contentType := c.Request.Header.Get("Content-Type")
	if strings.HasPrefix(contentType, "application/json") {
		storage, err := common.GetBodyStorage(c)
		if err != nil {
			return nil, err
		}
		requestBody, err := storage.Bytes()
		if err != nil {
			return nil, err
		}
		if !gjson.ValidBytes(requestBody) {
			return nil, errors.New("invalid JSON request body")
		}

		values := gjson.GetManyBytes(requestBody, "model", "group", "token_id")
		modelName, err := getJSONStringValue(values[0], "model")
		if err != nil {
			return nil, err
		}
		groupName, err := getJSONStringValue(values[1], "group")
		if err != nil {
			return nil, err
		}

		tokenId, err := getOptionalJSONInt(values[2], "token_id")
		if err != nil {
			return nil, err
		}

		return &playgroundImageRequestMeta{
			Model:   modelName,
			Group:   groupName,
			TokenId: tokenId,
		}, nil
	}

	var req playgroundImageFormRequest
	if err := common.UnmarshalBodyReusable(c, &req); err != nil {
		return nil, err
	}
	tokenId, err := parseOptionalIntString(req.TokenId, "token_id")
	if err != nil {
		return nil, err
	}
	return &playgroundImageRequestMeta{
		Model:   req.Model,
		Group:   req.Group,
		TokenId: tokenId,
	}, nil
}

func getOptionalJSONInt(result gjson.Result, field string) (int, error) {
	if !result.Exists() || result.Type == gjson.Null {
		return 0, nil
	}
	if result.Type == gjson.Number {
		return int(result.Int()), nil
	}
	if result.Type == gjson.String {
		return parseOptionalIntString(result.String(), field)
	}
	return 0, fmt.Errorf("field %s must be a number", field)
}

func parseOptionalIntString(value string, field string) (int, error) {
	value = strings.TrimSpace(value)
	if value == "" {
		return 0, nil
	}
	parsed, err := strconv.Atoi(value)
	if err != nil {
		return 0, fmt.Errorf("field %s must be a number", field)
	}
	return parsed, nil
}

func PlaygroundImageTokenContext() func(c *gin.Context) {
	return func(c *gin.Context) {
		meta, err := parsePlaygroundImageRequestMeta(c)
		if err != nil {
			abortWithOpenAiMessage(c, http.StatusBadRequest, i18n.T(c, i18n.MsgDistributorInvalidRequest, map[string]any{"Error": err.Error()}))
			return
		}
		if meta.TokenId <= 0 {
			c.Next()
			return
		}

		userId := c.GetInt("id")
		token, err := model.GetTokenByIds(meta.TokenId, userId)
		if err != nil {
			abortWithOpenAiMessage(c, http.StatusForbidden, common.TranslateMessage(c, i18n.MsgTokenInvalid), types.ErrorCodeAccessDenied)
			return
		}

		validatedToken, err := model.ValidateUserToken(token.Key)
		if err != nil {
			if errors.Is(err, model.ErrDatabase) {
				common.SysLog("PlaygroundImageTokenContext ValidateUserToken database error: " + err.Error())
				abortWithOpenAiMessage(c, http.StatusInternalServerError, common.TranslateMessage(c, i18n.MsgDatabaseError))
			} else {
				abortWithOpenAiMessage(c, http.StatusUnauthorized, common.TranslateMessage(c, i18n.MsgTokenInvalid))
			}
			return
		}
		if validatedToken.Id != token.Id || validatedToken.UserId != userId {
			abortWithOpenAiMessage(c, http.StatusForbidden, common.TranslateMessage(c, i18n.MsgTokenInvalid), types.ErrorCodeAccessDenied)
			return
		}

		if allowIps := validatedToken.GetIpLimits(); len(allowIps) > 0 {
			clientIp := c.ClientIP()
			ip := net.ParseIP(clientIp)
			if ip == nil {
				abortWithOpenAiMessage(c, http.StatusForbidden, "无法解析客户端 IP 地址", types.ErrorCodeAccessDenied)
				return
			}
			if !common.IsIpInCIDRList(ip, allowIps) {
				abortWithOpenAiMessage(c, http.StatusForbidden, "您的 IP 不在令牌允许访问的列表中", types.ErrorCodeAccessDenied)
				return
			}
		}

		userCache, err := model.GetUserCache(userId)
		if err != nil {
			common.SysLog(fmt.Sprintf("PlaygroundImageTokenContext GetUserCache error for user %d: %v", userId, err))
			abortWithOpenAiMessage(c, http.StatusInternalServerError, common.TranslateMessage(c, i18n.MsgDatabaseError))
			return
		}
		if userCache.Status != common.UserStatusEnabled {
			abortWithOpenAiMessage(c, http.StatusForbidden, common.TranslateMessage(c, i18n.MsgAuthUserBanned))
			return
		}

		userCache.WriteContext(c)
		usingGroup := userCache.Group
		if validatedToken.Group != "" {
			if _, ok := service.GetUserUsableGroups(userCache.Group)[validatedToken.Group]; !ok {
				abortWithOpenAiMessage(c, http.StatusForbidden, fmt.Sprintf("无权访问 %s 分组", validatedToken.Group), types.ErrorCodeAccessDenied)
				return
			}
			if !ratio_setting.ContainsGroupRatio(validatedToken.Group) && validatedToken.Group != "auto" {
				abortWithOpenAiMessage(c, http.StatusForbidden, fmt.Sprintf("分组 %s 已被弃用", validatedToken.Group), types.ErrorCodeAccessDenied)
				return
			}
			usingGroup = validatedToken.Group
		}
		common.SetContextKey(c, constant.ContextKeyUsingGroup, usingGroup)

		if err := SetupContextForToken(c, validatedToken); err != nil {
			return
		}
		c.Set(playgroundSelectedTokenContextKey, true)
		c.Next()
	}
}
