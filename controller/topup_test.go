package controller

import (
	"net/http/httptest"
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/gin-gonic/gin"
)

func TestGetTopUpInfoIncludesXianyuLink(t *testing.T) {
	gin.SetMode(gin.TestMode)

	previousLink := common.XianyuLink
	common.XianyuLink = "https://2.taobao.com/item.htm?id=123"
	t.Cleanup(func() {
		common.XianyuLink = previousLink
	})

	recorder := httptest.NewRecorder()
	context, _ := gin.CreateTestContext(recorder)

	GetTopUpInfo(context)

	var response struct {
		Success bool           `json:"success"`
		Data    map[string]any `json:"data"`
	}
	if err := common.Unmarshal(recorder.Body.Bytes(), &response); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if !response.Success {
		t.Fatal("expected successful topup info response")
	}
	if response.Data["xianyu_link"] != common.XianyuLink {
		t.Fatalf("xianyu_link = %v, want %q", response.Data["xianyu_link"], common.XianyuLink)
	}
}
