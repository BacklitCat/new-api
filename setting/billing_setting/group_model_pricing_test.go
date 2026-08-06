package billing_setting

import (
	"testing"

	"github.com/QuantumNous/new-api/setting/config"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestCheckGroupModelPricing(t *testing.T) {
	tests := []struct {
		name    string
		value   string
		wantErr string
	}{
		{
			name:  "accepts per request and ratio overrides",
			value: `{"pro":{"image-2":{"billing_mode":"per-request","model_price":0.2}},"default":{"image-2":{"billing_mode":"ratio"}}}`,
		},
		{
			name:    "requires price for per request",
			value:   `{"pro":{"image-2":{"billing_mode":"per-request"}}}`,
			wantErr: "requires model_price",
		},
		{
			name:    "rejects negative price",
			value:   `{"pro":{"image-2":{"billing_mode":"per-request","model_price":-0.1}}}`,
			wantErr: "finite and non-negative",
		},
		{
			name:    "rejects price on ratio override",
			value:   `{"pro":{"image-2":{"billing_mode":"ratio","model_price":0.2}}}`,
			wantErr: "must not set model_price",
		},
		{
			name:    "rejects unsupported mode",
			value:   `{"pro":{"image-2":{"billing_mode":"tiered_expr"}}}`,
			wantErr: "unsupported billing_mode",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := CheckGroupModelPricing(tt.value)
			if tt.wantErr == "" {
				require.NoError(t, err)
				return
			}
			require.Error(t, err)
			assert.Contains(t, err.Error(), tt.wantErr)
		})
	}
}

func TestGetGroupModelPricingUsesCompactFallback(t *testing.T) {
	saved := map[string]string{}
	require.NoError(t, config.GlobalConfig.SaveToDB(func(key, value string) error {
		saved[key] = value
		return nil
	}))
	t.Cleanup(func() {
		require.NoError(t, config.GlobalConfig.LoadFromDB(saved))
	})

	require.NoError(t, config.GlobalConfig.LoadFromDB(map[string]string{
		"billing_setting.group_model_pricing": `{"pro":{"image-2":{"billing_mode":"per-request","model_price":0.2},"*-openai-compact":{"billing_mode":"ratio"}}}`,
	}))

	rule, ok := GetGroupModelPricing("pro", "image-2")
	require.True(t, ok)
	require.NotNil(t, rule.ModelPrice)
	assert.Equal(t, BillingModePerRequest, rule.BillingMode)
	assert.Equal(t, 0.2, *rule.ModelPrice)

	rule, ok = GetGroupModelPricing("pro", "other-openai-compact")
	require.True(t, ok)
	assert.Equal(t, BillingModeRatio, rule.BillingMode)
	assert.Nil(t, rule.ModelPrice)
}

func TestGetGroupPerRequestPricesReturnsOnlyValidRequestPrices(t *testing.T) {
	saved := map[string]string{}
	require.NoError(t, config.GlobalConfig.SaveToDB(func(key, value string) error {
		saved[key] = value
		return nil
	}))
	t.Cleanup(func() {
		require.NoError(t, config.GlobalConfig.LoadFromDB(saved))
	})

	require.NoError(t, config.GlobalConfig.LoadFromDB(map[string]string{
		"billing_setting.group_model_pricing": `{"pro":{"image-2":{"billing_mode":"per-request","model_price":0.2},"text":{"billing_mode":"ratio"}}}`,
	}))

	assert.Equal(t, map[string]float64{"image-2": 0.2}, GetGroupPerRequestPrices("pro"))
	assert.Empty(t, GetGroupPerRequestPrices("unknown"))
}
