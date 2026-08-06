package helper

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/QuantumNous/new-api/common"
	relaycommon "github.com/QuantumNous/new-api/relay/common"
	"github.com/QuantumNous/new-api/setting/config"
	"github.com/QuantumNous/new-api/setting/ratio_setting"
	"github.com/QuantumNous/new-api/types"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestModelPriceHelperUsesGroupSpecificBillingMode(t *testing.T) {
	gin.SetMode(gin.TestMode)

	savedConfig := map[string]string{}
	require.NoError(t, config.GlobalConfig.SaveToDB(func(key, value string) error {
		savedConfig[key] = value
		return nil
	}))
	savedModelPrices := ratio_setting.ModelPrice2JSONString()
	savedModelRatios := ratio_setting.ModelRatio2JSONString()
	savedGroupRatios := ratio_setting.GroupRatio2JSONString()
	savedPreConsumedQuota := common.PreConsumedQuota
	t.Cleanup(func() {
		require.NoError(t, config.GlobalConfig.LoadFromDB(savedConfig))
		require.NoError(t, ratio_setting.UpdateModelPriceByJSONString(savedModelPrices))
		require.NoError(t, ratio_setting.UpdateModelRatioByJSONString(savedModelRatios))
		require.NoError(t, ratio_setting.UpdateGroupRatioByJSONString(savedGroupRatios))
		common.PreConsumedQuota = savedPreConsumedQuota
	})

	require.NoError(t, ratio_setting.UpdateModelPriceByJSONString(`{}`))
	require.NoError(t, ratio_setting.UpdateModelRatioByJSONString(`{"image-2":10}`))
	require.NoError(t, ratio_setting.UpdateGroupRatioByJSONString(`{"per-call":1,"per-token":1}`))
	require.NoError(t, config.GlobalConfig.LoadFromDB(map[string]string{
		"billing_setting.group_model_pricing": `{"per-call":{"image-2":{"billing_mode":"per-request","model_price":0.2}},"per-token":{"image-2":{"billing_mode":"ratio"}}}`,
	}))

	newContext := func(group string) (*gin.Context, *relaycommon.RelayInfo) {
		ctx, _ := gin.CreateTestContext(httptest.NewRecorder())
		ctx.Request = httptest.NewRequest(http.MethodPost, "/v1/chat/completions", nil)
		ctx.Set("group", group)
		return ctx, &relaycommon.RelayInfo{
			OriginModelName: "image-2",
			UserGroup:       "site-user",
			UsingGroup:      group,
		}
	}

	ctx, info := newContext("per-call")
	priceData, err := ModelPriceHelper(ctx, info, 1000, &types.TokenCountMeta{})
	require.NoError(t, err)
	assert.True(t, priceData.UsePrice)
	assert.Equal(t, 0.2, priceData.ModelPrice)
	assert.Equal(t, 100000, priceData.QuotaToPreConsume)

	ctx, info = newContext("per-token")
	priceData, err = ModelPriceHelper(ctx, info, 1000, &types.TokenCountMeta{})
	require.NoError(t, err)
	assert.False(t, priceData.UsePrice)
	assert.Equal(t, 10.0, priceData.ModelRatio)
	assert.Equal(t, 10000, priceData.QuotaToPreConsume)

	ctx, info = newContext("per-call")
	priceData, err = ModelPriceHelperPerCall(ctx, info)
	require.NoError(t, err)
	assert.True(t, priceData.UsePrice)
	assert.Equal(t, 100000, priceData.Quota)

	ctx, info = newContext("per-token")
	priceData, err = ModelPriceHelperPerCall(ctx, info)
	require.NoError(t, err)
	assert.False(t, priceData.UsePrice)
	assert.Equal(t, 2500000, priceData.Quota)
}
