package http

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"github.com/influxdata/platform/inmem"
	platformtesting "github.com/influxdata/platform/testing"
	"io/ioutil"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/influxdata/platform"
	"github.com/influxdata/platform/mock"
	"github.com/julienschmidt/httprouter"
)

func TestService_handleGetAuthorizations(t *testing.T) {
	type fields struct {
		AuthorizationService platform.AuthorizationService
	}
	type args struct {
		queryParams map[string][]string
	}
	type wants struct {
		statusCode  int
		contentType string
		body        string
	}

	tests := []struct {
		token  string
		fields fields
		args   args
		wants  wants
	}{
		{
			token: "get all authorizations",
			fields: fields{
				&mock.AuthorizationService{
					FindAuthorizationsFn: func(ctx context.Context, filter platform.AuthorizationFilter, opts ...platform.FindOptions) ([]*platform.Authorization, int, error) {
						return []*platform.Authorization{
							{
								ID:     platform.ID("0"),
								Token:  "hello",
								UserID: platform.ID("10"),
							},
							{
								ID:     platform.ID("2"),
								Token:  "example",
								UserID: platform.ID("20"),
							},
						}, 2, nil
					},
				},
			},
			args: args{},
			wants: wants{
				statusCode:  http.StatusOK,
				contentType: "application/json; charset=utf-8",
				body: `
{
  "links": {
    "self": "/v1/authorizations"
  },
  "auths": [
    {
      "links": {
        "user": "/v1/users/3130",
        "self": "/v1/authorizations/30"
      },
      "id": "30",
      "userID": "3130",
      "status": "",
      "token": "hello"
    },
    {
      "links": {
        "user": "/v1/users/3230",
        "self": "/v1/authorizations/32"
      },
      "id": "32",
      "userID": "3230",
      "status": "",
      "token": "example"
    }
  ]
}
`,
			},
		},
		{
			token: "get all authorizations when there are none",
			fields: fields{
				&mock.AuthorizationService{
					FindAuthorizationsFn: func(ctx context.Context, filter platform.AuthorizationFilter, opts ...platform.FindOptions) ([]*platform.Authorization, int, error) {
						return []*platform.Authorization{}, 0, nil
					},
				},
			},
			args: args{},
			wants: wants{
				statusCode:  http.StatusOK,
				contentType: "application/json; charset=utf-8",
				body: `
{
  "links": {
    "self": "/v1/authorizations"
  },
  "auths": []
}`,
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.token, func(t *testing.T) {
			h := NewAuthorizationHandler()
			h.AuthorizationService = tt.fields.AuthorizationService

			r := httptest.NewRequest("GET", "http://any.url", nil)

			qp := r.URL.Query()
			for k, vs := range tt.args.queryParams {
				for _, v := range vs {
					qp.Add(k, v)
				}
			}
			r.URL.RawQuery = qp.Encode()

			w := httptest.NewRecorder()

			h.handleGetAuthorizations(w, r)

			res := w.Result()
			content := res.Header.Get("Content-Type")
			body, _ := ioutil.ReadAll(res.Body)

			if res.StatusCode != tt.wants.statusCode {
				t.Errorf("%q. handleGetAuthorizations() = %v, want %v", tt.token, res.StatusCode, tt.wants.statusCode)
			}
			if tt.wants.contentType != "" && content != tt.wants.contentType {
				t.Errorf("%q. handleGetAuthorizations() = %v, want %v", tt.token, content, tt.wants.contentType)
			}
			if eq, _ := jsonEqual(string(body), tt.wants.body); tt.wants.body != "" && !eq {
				t.Errorf("%q. handleGetAuthorizations() = \n***%v***\n,\nwant\n***%v***", tt.token, string(body), tt.wants.body)
			}

		})
	}
}

func TestService_handleGetAuthorization(t *testing.T) {
	type fields struct {
		AuthorizationService platform.AuthorizationService
	}
	type args struct {
		id string
	}
	type wants struct {
		statusCode  int
		contentType string
		body        string
	}

	tests := []struct {
		token  string
		fields fields
		args   args
		wants  wants
	}{
		{
			token: "get a authorization by id",
			fields: fields{
				&mock.AuthorizationService{
					FindAuthorizationByIDFn: func(ctx context.Context, id platform.ID) (*platform.Authorization, error) {
						if bytes.Equal(id, mustParseID("020f755c3c082000")) {
							return &platform.Authorization{
								ID:     mustParseID("020f755c3c082000"),
								UserID: mustParseID("020f755c3c082000"),
								Token:  "hello",
							}, nil
						}

						return nil, fmt.Errorf("not found")
					},
				},
			},
			args: args{
				id: "020f755c3c082000",
			},
			wants: wants{
				statusCode:  http.StatusOK,
				contentType: "application/json; charset=utf-8",
				body: `
{
  "links": {
    "user": "/v1/users/020f755c3c082000",
    "self": "/v1/authorizations/020f755c3c082000"
  },
  "id": "020f755c3c082000",
  "userID": "020f755c3c082000",
  "token": "hello",
  "status": ""
}
`,
			},
		},
		{
			token: "not found",
			fields: fields{
				&mock.AuthorizationService{
					FindAuthorizationByIDFn: func(ctx context.Context, id platform.ID) (*platform.Authorization, error) {
						return nil, fmt.Errorf("authorization not found")
					},
				},
			},
			args: args{
				id: "020f755c3c082000",
			},
			wants: wants{
				statusCode: http.StatusNotFound,
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.token, func(t *testing.T) {
			h := NewAuthorizationHandler()
			h.AuthorizationService = tt.fields.AuthorizationService

			r := httptest.NewRequest("GET", "http://any.url", nil)

			r = r.WithContext(context.WithValue(
				context.TODO(),
				httprouter.ParamsKey,
				httprouter.Params{
					{
						Key:   "id",
						Value: tt.args.id,
					},
				}))

			w := httptest.NewRecorder()

			h.handleGetAuthorization(w, r)

			res := w.Result()
			content := res.Header.Get("Content-Type")
			body, _ := ioutil.ReadAll(res.Body)
			t.Logf(res.Header.Get("X-Influx-Error"))

			if res.StatusCode != tt.wants.statusCode {
				t.Errorf("%q. handleGetAuthorization() = %v, want %v", tt.token, res.StatusCode, tt.wants.statusCode)
			}
			if tt.wants.contentType != "" && content != tt.wants.contentType {
				t.Errorf("%q. handleGetAuthorization() = %v, want %v", tt.token, content, tt.wants.contentType)
			}
			if eq, _ := jsonEqual(string(body), tt.wants.body); tt.wants.body != "" && !eq {
				t.Errorf("%q. handleGetAuthorization() = \n***%v***\n,\nwant\n***%v***", tt.token, string(body), tt.wants.body)
			}
		})
	}
}

func TestService_handlePostAuthorization(t *testing.T) {
	type fields struct {
		AuthorizationService platform.AuthorizationService
	}
	type args struct {
		authorization *platform.Authorization
	}
	type wants struct {
		statusCode  int
		contentType string
		body        string
	}

	tests := []struct {
		token  string
		fields fields
		args   args
		wants  wants
	}{
		{
			token: "create a new authorization",
			fields: fields{
				&mock.AuthorizationService{
					CreateAuthorizationFn: func(ctx context.Context, c *platform.Authorization) error {
						c.ID = mustParseID("020f755c3c082000")
						return nil
					},
				},
			},
			args: args{
				authorization: &platform.Authorization{
					Token:  "hello",
					UserID: platform.ID("0"),
				},
			},
			wants: wants{
				statusCode:  http.StatusCreated,
				contentType: "application/json; charset=utf-8",
				body: `
{
  "links": {
    "user": "/v1/users/30",
    "self": "/v1/authorizations/020f755c3c082000"
  },
  "id": "020f755c3c082000",
  "userID": "30",
  "token": "hello",
  "status": ""
}
`,
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.token, func(t *testing.T) {
			h := NewAuthorizationHandler()
			h.AuthorizationService = tt.fields.AuthorizationService

			b, err := json.Marshal(tt.args.authorization)
			if err != nil {
				t.Fatalf("failed to unmarshal authorization: %v", err)
			}

			r := httptest.NewRequest("GET", "http://any.url", bytes.NewReader(b))
			w := httptest.NewRecorder()

			h.handlePostAuthorization(w, r)

			res := w.Result()
			content := res.Header.Get("Content-Type")
			body, _ := ioutil.ReadAll(res.Body)

			if res.StatusCode != tt.wants.statusCode {
				t.Errorf("%q. handlePostAuthorization() = %v, want %v", tt.token, res.StatusCode, tt.wants.statusCode)
			}
			if tt.wants.contentType != "" && content != tt.wants.contentType {
				t.Errorf("%q. handlePostAuthorization() = %v, want %v", tt.token, content, tt.wants.contentType)
			}
			if eq, _ := jsonEqual(string(body), tt.wants.body); tt.wants.body != "" && !eq {
				t.Errorf("%q. handlePostAuthorization() = \n***%v***\n,\nwant\n***%v***", tt.token, string(body), tt.wants.body)
			}
		})
	}
}

func TestService_handleDeleteAuthorization(t *testing.T) {
	type fields struct {
		AuthorizationService platform.AuthorizationService
	}
	type args struct {
		id string
	}
	type wants struct {
		statusCode  int
		contentType string
		body        string
	}

	tests := []struct {
		token  string
		fields fields
		args   args
		wants  wants
	}{
		{
			token: "remove a authorization by id",
			fields: fields{
				&mock.AuthorizationService{
					DeleteAuthorizationFn: func(ctx context.Context, id platform.ID) error {
						if bytes.Equal(id, mustParseID("020f755c3c082000")) {
							return nil
						}

						return fmt.Errorf("wrong id")
					},
				},
			},
			args: args{
				id: "020f755c3c082000",
			},
			wants: wants{
				statusCode: http.StatusNoContent,
			},
		},
		{
			token: "authorization not found",
			fields: fields{
				&mock.AuthorizationService{
					DeleteAuthorizationFn: func(ctx context.Context, id platform.ID) error {
						return fmt.Errorf("authorization not found")
					},
				},
			},
			args: args{
				id: "020f755c3c082000",
			},
			wants: wants{
				statusCode: http.StatusNotFound,
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.token, func(t *testing.T) {
			h := NewAuthorizationHandler()
			h.AuthorizationService = tt.fields.AuthorizationService

			r := httptest.NewRequest("GET", "http://any.url", nil)

			r = r.WithContext(context.WithValue(
				context.TODO(),
				httprouter.ParamsKey,
				httprouter.Params{
					{
						Key:   "id",
						Value: tt.args.id,
					},
				}))

			w := httptest.NewRecorder()

			h.handleDeleteAuthorization(w, r)

			res := w.Result()
			content := res.Header.Get("Content-Type")
			body, _ := ioutil.ReadAll(res.Body)

			if res.StatusCode != tt.wants.statusCode {
				t.Errorf("%q. handleDeleteAuthorization() = %v, want %v", tt.token, res.StatusCode, tt.wants.statusCode)
			}
			if tt.wants.contentType != "" && content != tt.wants.contentType {
				t.Errorf("%q. handleDeleteAuthorization() = %v, want %v", tt.token, content, tt.wants.contentType)
			}
			if eq, _ := jsonEqual(string(body), tt.wants.body); tt.wants.body != "" && !eq {
				t.Errorf("%q. handleDeleteAuthorization() = \n***%v***\n,\nwant\n***%v***", tt.token, string(body), tt.wants.body)
			}
		})
	}
}

func initAuthorizationService(f platformtesting.AuthorizationFields, t *testing.T) (platform.AuthorizationService, func()) {
	t.Helper()

	svc := inmem.NewService()
	svc.IDGenerator = f.IDGenerator
	svc.TokenGenerator = f.TokenGenerator

	ctx := context.TODO()
	for _, u := range f.Users {
		if err := svc.PutUser(ctx, u); err != nil {
			t.Fatalf("failed to populate users")
		}
	}
	for _, u := range f.Authorizations {
		if err := svc.PutAuthorization(ctx, u); err != nil {
			t.Fatalf("failed to populate authorizations")
		}
	}

	handler := NewAuthorizationHandler()
	handler.AuthorizationService = svc
	server := httptest.NewServer(handler)
	client := AuthorizationService{
		Addr: server.URL,
	}
	done := func() {
		server.Close()
	}

	return &client, done
}

func TestAuthorizationService_CreateAuthorization(t *testing.T) {
	platformtesting.CreateAuthorization(initAuthorizationService, t)
}

func TestAuthorizationService_FindAuthorizationByID(t *testing.T) {
	platformtesting.FindAuthorizationByID(initAuthorizationService, t)
}

func TestAuthorizationService_FindAuthorizationByToken(t *testing.T) {
	platformtesting.FindAuthorizationByToken(initAuthorizationService, t)
}

func TestAuthorizationService_FindAuthorizations(t *testing.T) {
	platformtesting.FindAuthorizations(initAuthorizationService, t)
}

func TestAuthorizationService_DeleteAuthorization(t *testing.T) {
	platformtesting.DeleteAuthorization(initAuthorizationService, t)
}
