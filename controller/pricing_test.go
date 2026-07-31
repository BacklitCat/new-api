package controller

import (
	"testing"

	"github.com/QuantumNous/new-api/model"
	"github.com/stretchr/testify/assert"
)

func TestFilterPricingByUsableGroupsHidesCompactAliases(t *testing.T) {
	pricing := []model.Pricing{
		{ModelName: "gpt-5.6", EnableGroup: []string{"default"}},
		{ModelName: "gpt-5.6-openai-compact", EnableGroup: []string{"default"}},
	}

	filtered := filterPricingByUsableGroups(pricing, map[string]string{"default": "Default"})

	assert.Equal(t, []model.Pricing{pricing[0]}, filtered)
}
