package controller

import (
	"errors"
	"fmt"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/constant"
	"github.com/QuantumNous/new-api/i18n"
	"github.com/QuantumNous/new-api/middleware"
	"github.com/QuantumNous/new-api/model"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	"github.com/QuantumNous/new-api/types"

	"github.com/gin-gonic/gin"
)

type imagePlaygroundTokenOption struct {
	Id     int    `json:"id"`
	Name   string `json:"name"`
	Status int    `json:"status"`
}

func Playground(c *gin.Context) {
	var newAPIError *types.NewAPIError

	defer func() {
		if newAPIError != nil {
			c.JSON(newAPIError.StatusCode, gin.H{
				"error": newAPIError.ToOpenAIError(),
			})
		}
	}()

	useAccessToken := c.GetBool("use_access_token")
	if useAccessToken {
		newAPIError = types.NewError(errors.New("暂不支持使用 access token"), types.ErrorCodeAccessDenied, types.ErrOptionWithSkipRetry())
		return
	}

	relayInfo, err := relaycommon.GenRelayInfo(c, types.RelayFormatOpenAI, nil, nil)
	if err != nil {
		newAPIError = types.NewError(err, types.ErrorCodeInvalidRequest, types.ErrOptionWithSkipRetry())
		return
	}

	userId := c.GetInt("id")

	// Write user context to ensure acceptUnsetRatio is available
	userCache, err := model.GetUserCache(userId)
	if err != nil {
		newAPIError = types.NewError(err, types.ErrorCodeQueryDataError, types.ErrOptionWithSkipRetry())
		return
	}
	userCache.WriteContext(c)

	tempToken := &model.Token{
		UserId: userId,
		Name:   fmt.Sprintf("playground-%s", relayInfo.UsingGroup),
		Group:  relayInfo.UsingGroup,
	}
	_ = middleware.SetupContextForToken(c, tempToken)

	Relay(c, types.RelayFormatOpenAI)
}

func PlaygroundResponses(c *gin.Context) {
	var newAPIError *types.NewAPIError

	defer func() {
		if newAPIError != nil {
			c.JSON(newAPIError.StatusCode, gin.H{
				"error": newAPIError.ToOpenAIError(),
			})
		}
	}()

	useAccessToken := c.GetBool("use_access_token")
	if useAccessToken {
		newAPIError = types.NewError(errors.New("暂不支持使用 access token"), types.ErrorCodeAccessDenied, types.ErrOptionWithSkipRetry())
		return
	}

	if c.GetInt("token_id") == 0 {
		userId := c.GetInt("id")
		userCache, err := model.GetUserCache(userId)
		if err != nil {
			newAPIError = types.NewError(err, types.ErrorCodeQueryDataError, types.ErrOptionWithSkipRetry())
			return
		}
		userCache.WriteContext(c)

		tempToken := &model.Token{
			UserId: userId,
			Name:   fmt.Sprintf("responses-playground-%s", common.GetContextKeyString(c, constant.ContextKeyUsingGroup)),
			Group:  common.GetContextKeyString(c, constant.ContextKeyUsingGroup),
		}
		_ = middleware.SetupContextForToken(c, tempToken)
	}

	Relay(c, types.RelayFormatOpenAIResponses)
}

func ImagePlayground(c *gin.Context) {
	var newAPIError *types.NewAPIError

	defer func() {
		if newAPIError != nil {
			c.JSON(newAPIError.StatusCode, gin.H{
				"error": newAPIError.ToOpenAIError(),
			})
		}
	}()

	useAccessToken := c.GetBool("use_access_token")
	if useAccessToken {
		newAPIError = types.NewError(errors.New("暂不支持使用 access token"), types.ErrorCodeAccessDenied, types.ErrOptionWithSkipRetry())
		return
	}

	if c.GetInt("token_id") == 0 {
		relayInfo, err := relaycommon.GenRelayInfo(c, types.RelayFormatOpenAIImage, nil, nil)
		if err != nil {
			newAPIError = types.NewError(err, types.ErrorCodeInvalidRequest, types.ErrOptionWithSkipRetry())
			return
		}

		userId := c.GetInt("id")
		userCache, err := model.GetUserCache(userId)
		if err != nil {
			newAPIError = types.NewError(err, types.ErrorCodeQueryDataError, types.ErrOptionWithSkipRetry())
			return
		}
		userCache.WriteContext(c)

		tempToken := &model.Token{
			UserId: userId,
			Name:   fmt.Sprintf("image-playground-%s", relayInfo.UsingGroup),
			Group:  relayInfo.UsingGroup,
		}
		_ = middleware.SetupContextForToken(c, tempToken)
	}

	Relay(c, types.RelayFormatOpenAIImage)
}

func GetImagePlaygroundTokens(c *gin.Context) {
	userId := c.GetInt("id")
	tokens, err := model.GetAllUserTokens(userId, 0, 1000)
	if err != nil {
		common.ApiErrorI18n(c, i18n.MsgDatabaseError)
		return
	}

	options := make([]imagePlaygroundTokenOption, 0, len(tokens))
	for _, token := range tokens {
		if token.Status != common.TokenStatusEnabled {
			continue
		}
		options = append(options, imagePlaygroundTokenOption{
			Id:     token.Id,
			Name:   token.Name,
			Status: token.Status,
		})
	}
	common.ApiSuccess(c, gin.H{"items": options})
}
