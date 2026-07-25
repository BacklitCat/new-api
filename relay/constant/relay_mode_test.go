package constant

import "testing"

func TestPath2RelayModeSupportsImagePlayground(t *testing.T) {
	tests := []struct {
		path string
		want int
	}{
		{path: "/pg/images/generations", want: RelayModeImagesGenerations},
		{path: "/pg/images/edits", want: RelayModeImagesEdits},
		{path: "/pg/responses", want: RelayModeResponses},
		{path: "/pg/responses/compact", want: RelayModeResponsesCompact},
	}

	for _, test := range tests {
		t.Run(test.path, func(t *testing.T) {
			if got := Path2RelayMode(test.path); got != test.want {
				t.Fatalf("Path2RelayMode(%q) = %d, want %d", test.path, got, test.want)
			}
		})
	}
}
