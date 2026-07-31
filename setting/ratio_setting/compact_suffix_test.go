package ratio_setting

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestCompactPricingFallsBackToBaseModel(t *testing.T) {
	savedModelPrices := ModelPrice2JSONString()
	savedModelRatios := ModelRatio2JSONString()
	savedCompletionRatios := CompletionRatio2JSONString()
	savedCacheRatios := CacheRatio2JSONString()
	savedCreateCacheRatios := CreateCacheRatio2JSONString()
	t.Cleanup(func() {
		require.NoError(t, UpdateModelPriceByJSONString(savedModelPrices))
		require.NoError(t, UpdateModelRatioByJSONString(savedModelRatios))
		require.NoError(t, UpdateCompletionRatioByJSONString(savedCompletionRatios))
		require.NoError(t, UpdateCacheRatioByJSONString(savedCacheRatios))
		require.NoError(t, UpdateCreateCacheRatioByJSONString(savedCreateCacheRatios))
	})

	require.NoError(t, UpdateModelPriceByJSONString(`{"fixed-base":0.25}`))
	require.NoError(t, UpdateModelRatioByJSONString(`{"ratio-base":2}`))
	require.NoError(t, UpdateCompletionRatioByJSONString(`{"ratio-base":3}`))
	require.NoError(t, UpdateCacheRatioByJSONString(`{"ratio-base":0.1}`))
	require.NoError(t, UpdateCreateCacheRatioByJSONString(`{"ratio-base":1.25}`))

	price, found := GetModelPrice("fixed-base-openai-compact", false)
	require.True(t, found)
	assert.Equal(t, 0.25, price)

	ratio, found, _ := GetModelRatio("ratio-base-openai-compact")
	require.True(t, found)
	assert.Equal(t, 2.0, ratio)
	assert.Equal(t, 3.0, GetCompletionRatio("ratio-base-openai-compact"))
	assert.Equal(t, 3.0, GetCompletionRatioInfo("ratio-base-openai-compact").Ratio)

	cacheRatio, found := GetCacheRatio("ratio-base-openai-compact")
	require.True(t, found)
	assert.Equal(t, 0.1, cacheRatio)
	createCacheRatio, found := GetCreateCacheRatio("ratio-base-openai-compact")
	require.True(t, found)
	assert.Equal(t, 1.25, createCacheRatio)
}
