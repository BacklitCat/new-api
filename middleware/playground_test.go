package middleware

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestPlaygroundImageTokenContextAllowsAccountDefaultWithoutToken(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	continued := false
	router.POST(
		"/pg/images/generations",
		PlaygroundImageTokenContext(),
		func(c *gin.Context) {
			continued = true
			c.Status(http.StatusNoContent)
		},
	)

	request := httptest.NewRequest(
		http.MethodPost,
		"/pg/images/generations",
		strings.NewReader(`{"model":"gpt-image-2"}`),
	)
	request.Header.Set("Content-Type", "application/json")
	response := httptest.NewRecorder()

	router.ServeHTTP(response, request)

	require.Equal(t, http.StatusNoContent, response.Code)
	assert.True(t, continued)
}

func TestParsePlaygroundImageRequestMetaFromJSON(t *testing.T) {
	gin.SetMode(gin.TestMode)
	request := httptest.NewRequest(
		"POST",
		"/pg/images/generations",
		strings.NewReader(`{"model":"gpt-image-2","group":"auto","token_id":42}`),
	)
	request.Header.Set("Content-Type", "application/json")
	context, _ := gin.CreateTestContext(httptest.NewRecorder())
	context.Request = request

	meta, err := parsePlaygroundImageRequestMeta(context)
	if err != nil {
		t.Fatalf("parse request: %v", err)
	}
	if meta.Model != "gpt-image-2" || meta.Group != "auto" || meta.TokenId != 42 {
		t.Fatalf("unexpected metadata: %+v", meta)
	}
}

func TestParsePlaygroundImageRequestMetaRejectsInvalidTokenID(t *testing.T) {
	gin.SetMode(gin.TestMode)
	request := httptest.NewRequest(
		"POST",
		"/pg/responses",
		strings.NewReader(`{"model":"gpt-5.6-sol","token_id":true}`),
	)
	request.Header.Set("Content-Type", "application/json")
	context, _ := gin.CreateTestContext(httptest.NewRecorder())
	context.Request = request

	if _, err := parsePlaygroundImageRequestMeta(context); err == nil {
		t.Fatal("expected invalid token_id to be rejected")
	}
}

func TestPlaygroundPathDetection(t *testing.T) {
	if !isPlaygroundImagePath("/pg/images/generations") {
		t.Fatal("expected image generation path to be detected")
	}
	if !isPlaygroundImagePath("/pg/images/edits") {
		t.Fatal("expected image edit path to be detected")
	}
	if !isPlaygroundResponsesPath("/pg/responses") {
		t.Fatal("expected Responses path to be detected")
	}
	if isPlaygroundImagePath("/v1/images/generations") {
		t.Fatal("regular relay path must not be treated as playground")
	}
}
