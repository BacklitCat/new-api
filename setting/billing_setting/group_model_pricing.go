package billing_setting

import (
	"fmt"
	"math"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/setting/ratio_setting"
)

// GroupModelPricingRule overrides the legacy model-wide billing mode for one
// model in one billing group. An absent rule preserves the existing model-wide
// pricing behavior.
type GroupModelPricingRule struct {
	BillingMode string   `json:"billing_mode"`
	ModelPrice  *float64 `json:"model_price,omitempty"`
}

// GetGroupModelPricing returns the most specific configured rule for a model.
// Compact response aliases follow the same wildcard/base-model lookup rules as
// the existing model price and ratio settings.
func GetGroupModelPricing(group, model string) (GroupModelPricingRule, bool) {
	if billingSetting.GroupModelPricing == nil || group == "" || model == "" {
		return GroupModelPricingRule{}, false
	}

	rules, ok := billingSetting.GroupModelPricing.Get(group)
	if !ok {
		return GroupModelPricingRule{}, false
	}

	model = ratio_setting.FormatMatchingModelName(model)
	if rule, ok := rules[model]; ok {
		return rule, true
	}
	if strings.HasSuffix(model, ratio_setting.CompactModelSuffix) {
		if rule, ok := rules[ratio_setting.CompactWildcardModelKey]; ok {
			return rule, true
		}
		if rule, ok := rules[ratio_setting.WithoutCompactModelSuffix(model)]; ok {
			return rule, true
		}
	}
	return GroupModelPricingRule{}, false
}

// GetGroupPerRequestPrices returns the configured USD prices for all
// per-request models in one billing group. The response is only used for
// user-facing pricing hints; invalid in-memory values are ignored defensively.
func GetGroupPerRequestPrices(group string) map[string]float64 {
	prices := make(map[string]float64)
	if billingSetting.GroupModelPricing == nil || group == "" {
		return prices
	}

	rules, ok := billingSetting.GroupModelPricing.Get(group)
	if !ok {
		return prices
	}

	for model, rule := range rules {
		if rule.BillingMode != BillingModePerRequest || rule.ModelPrice == nil {
			continue
		}
		price := *rule.ModelPrice
		if math.IsNaN(price) || math.IsInf(price, 0) || price < 0 {
			continue
		}
		prices[model] = price
	}
	return prices
}

// HasGroupModelPricing reports whether any group override exists for a model.
// It is used by model discovery when a model has no legacy global price or
// ratio but is explicitly priced for a billing group.
func HasGroupModelPricing(model string) bool {
	if billingSetting.GroupModelPricing == nil || model == "" {
		return false
	}

	model = ratio_setting.FormatMatchingModelName(model)
	for _, rules := range billingSetting.GroupModelPricing.ReadAll() {
		if _, ok := rules[model]; ok {
			return true
		}
		if strings.HasSuffix(model, ratio_setting.CompactModelSuffix) {
			if _, ok := rules[ratio_setting.CompactWildcardModelKey]; ok {
				return true
			}
			if _, ok := rules[ratio_setting.WithoutCompactModelSuffix(model)]; ok {
				return true
			}
		}
	}
	return false
}

// CheckGroupModelPricing validates the persisted JSON before it reaches the
// live billing configuration. Invalid rules must never silently become a free
// or negative charge.
func CheckGroupModelPricing(jsonStr string) error {
	var pricing map[string]map[string]GroupModelPricingRule
	if err := common.UnmarshalJsonStr(jsonStr, &pricing); err != nil {
		return err
	}

	for group, rules := range pricing {
		if strings.TrimSpace(group) == "" {
			return fmt.Errorf("group model pricing contains an empty group")
		}
		for model, rule := range rules {
			if strings.TrimSpace(model) == "" {
				return fmt.Errorf("group %q contains an empty model name", group)
			}
			switch rule.BillingMode {
			case BillingModeRatio:
				if rule.ModelPrice != nil {
					return fmt.Errorf("group %q model %q ratio billing must not set model_price", group, model)
				}
			case BillingModePerRequest:
				if rule.ModelPrice == nil {
					return fmt.Errorf("group %q model %q per-request billing requires model_price", group, model)
				}
				if math.IsNaN(*rule.ModelPrice) || math.IsInf(*rule.ModelPrice, 0) || *rule.ModelPrice < 0 {
					return fmt.Errorf("group %q model %q model_price must be finite and non-negative", group, model)
				}
			default:
				return fmt.Errorf("group %q model %q has unsupported billing_mode %q", group, model, rule.BillingMode)
			}
		}
	}
	return nil
}
