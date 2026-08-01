package controller

import (
	"net/http"
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type imagePlaygroundTokensResponse struct {
	Items []imagePlaygroundTokenOption `json:"items"`
}

func TestGetImagePlaygroundTokensReturnsOnlyEnabledTokens(t *testing.T) {
	db := setupTokenControllerTestDB(t)
	enabledToken := seedToken(t, db, 1, "enabled", "enabled-token-key")
	disabledToken := seedToken(t, db, 1, "disabled", "disabled-token-key")
	require.NoError(t, db.Model(disabledToken).Update("status", common.TokenStatusDisabled).Error)
	seedToken(t, db, 2, "other-user", "other-user-token-key")

	ctx, recorder := newAuthenticatedContext(t, http.MethodGet, "/api/playground/image/tokens", nil, 1)
	GetImagePlaygroundTokens(ctx)

	response := decodeAPIResponse(t, recorder)
	require.True(t, response.Success, response.Message)

	var data imagePlaygroundTokensResponse
	require.NoError(t, common.Unmarshal(response.Data, &data))
	require.Len(t, data.Items, 1)
	assert.Equal(t, enabledToken.Id, data.Items[0].Id)
	assert.Equal(t, common.TokenStatusEnabled, data.Items[0].Status)
}
