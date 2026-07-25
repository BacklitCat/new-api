package middleware

import (
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

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
