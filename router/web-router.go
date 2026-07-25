package router

import (
	"embed"
	"io/fs"
	"net/http"
	"path"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/controller"
	"github.com/QuantumNous/new-api/middleware"
	"github.com/gin-contrib/gzip"
	"github.com/gin-contrib/static"
	"github.com/gin-gonic/gin"
)

// WebAssets holds the embedded dashboard frontend assets.
type WebAssets struct {
	BuildFS   embed.FS
	IndexPage []byte
}

func SetWebRouter(router *gin.Engine, assets WebAssets) {
	frontendFS := common.EmbedFolder(assets.BuildFS, "web/dist")
	buildFS, err := fs.Sub(assets.BuildFS, "web/dist")
	if err != nil {
		panic(err)
	}
	httpFS := http.FS(buildFS)

	router.Use(gzip.Gzip(gzip.DefaultCompression))
	router.Use(middleware.GlobalWebRateLimit())
	router.Use(middleware.Cache())
	router.GET("/image-playground", serveImagePlaygroundFile(buildFS, httpFS))
	router.GET("/image-playground/*filepath", serveImagePlaygroundFile(buildFS, httpFS))
	router.HEAD("/image-playground", serveImagePlaygroundFile(buildFS, httpFS))
	router.HEAD("/image-playground/*filepath", serveImagePlaygroundFile(buildFS, httpFS))
	router.Use(static.Serve("/", frontendFS))
	router.NoRoute(func(c *gin.Context) {
		c.Set(middleware.RouteTagKey, "web")
		if strings.HasPrefix(c.Request.RequestURI, "/v1") || strings.HasPrefix(c.Request.RequestURI, "/api") || strings.HasPrefix(c.Request.RequestURI, "/assets") {
			controller.RelayNotFound(c)
			return
		}
		c.Header("Cache-Control", "no-cache")
		c.Data(http.StatusOK, "text/html; charset=utf-8", assets.IndexPage)
	})
}

func serveImagePlaygroundFile(buildFS fs.FS, fileSystem http.FileSystem) gin.HandlerFunc {
	return func(c *gin.Context) {
		relativePath := strings.TrimPrefix(c.Param("filepath"), "/")
		if relativePath == "" {
			relativePath = "index.html"
		}

		cleanPath := strings.TrimPrefix(path.Clean("/"+relativePath), "/")
		if cleanPath == "." {
			cleanPath = "index.html"
		}

		if cleanPath == "index.html" {
			indexPage, err := fs.ReadFile(buildFS, "image-playground/index.html")
			if err != nil {
				controller.RelayNotFound(c)
				return
			}
			c.Header("Cache-Control", "no-cache")
			c.Data(http.StatusOK, "text/html; charset=utf-8", indexPage)
			return
		}

		filePath := path.Join("image-playground", cleanPath)
		file, err := fileSystem.Open(filePath)
		if err != nil {
			controller.RelayNotFound(c)
			return
		}
		_ = file.Close()

		c.FileFromFS(filePath, fileSystem)
	}
}
