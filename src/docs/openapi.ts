export const openApiSpec = {
  openapi: "3.0.0",
  info: {
    title: "ECO2 API",
    version: "1.0.0",
    description: `<p>API for ECO2 application, providing authentication and user management functionalities.</p><div style="text-align:center; margin-bottom: 16px;"><img src="/logo.png" alt="ECO2 Logo" style="height: 10px;" /></div>`,
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
  paths: {
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a new user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email", example: "user@example.com" },
                  password: { type: "string", minLength: 6, example: "secret123" },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "User created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    email: { type: "string" },
                  },
                },
              },
            },
          },
          409: { description: "User already exists" },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login and get tokens",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email", example: "user@example.com" },
                  password: { type: "string", example: "secret123" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Tokens returned",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    accessToken: { type: "string" },
                    refreshToken: { type: "string" },
                  },
                },
              },
            },
          },
          401: { description: "Invalid credentials" },
        },
      },
    },
    "/auth/refresh": {
      post: {
        tags: ["Auth"],
        summary: "Refresh access token",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["refreshToken"],
                properties: {
                  refreshToken: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "New tokens returned" },
          401: { description: "Invalid or expired refresh token" },
        },
      },
    },
    "/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Logout and revoke session",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["refreshToken"],
                properties: {
                  refreshToken: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          204: { description: "Logged out successfully" },
        },
      },
    },
    "/auth/firebase": {
      post: {
        tags: ["Auth"],
        summary: "Login with Firebase ID token",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["idToken"],
                properties: {
                  idToken: {
                    type: "string",
                    example: "eyJhbGciOiJSUzI1NiIs...",
                    description: "Firebase ID token obtained from client SDK"
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: "Returns your own accessToken and refreshToken",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    accessToken: { type: "string" },
                    refreshToken: { type: "string" }
                  }
                }
              }
            }
          },
          401: { description: "Invalid Firebase token" }
        }
      }
    },
    "/user/me": {
      get: {
        tags: ["User"],
        summary: "Get current authenticated user",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Returns the authenticated user's profile",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    email: { type: "string" },
                    username: { type: "string", nullable: true },
                    avatar_url: { type: "string", nullable: true },
                    role: { type: "string" },
                    plan_type: { type: "string" },
                    onboarding_completed: { type: "boolean" },
                    created_at: { type: "string", format: "date-time" }
                  }
                }
              }
            }
          },
          401: { description: "Invalid or missing token" }
        }
      }
    },
    "/user/onboarding": {
      patch: {
        tags: ["User"],
        summary: "Complete user onboarding",
        description: "Allows the authenticated user to complete their profile after registration. All fields are optional and can be filled progressively.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  username: {
                    type: "string",
                    minLength: 3,
                    maxLength: 30,
                    example: "planta_lover"
                  },
                  gender: {
                    type: "string",
                    enum: ["male", "female", "other", "prefer_not_to_say"],
                    example: "prefer_not_to_say"
                  },
                  birth_day: {
                    type: "string",
                    format: "date",
                    example: "1998-05-12"
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: "Profile updated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    email: { type: "string" },
                    username: { type: "string", nullable: true },
                    gender: { type: "string", nullable: true },
                    birth_day: { type: "string", format: "date", nullable: true },
                    onboarding_completed: { type: "boolean" }
                  }
                }
              }
            }
          },
          401: { description: "Missing or invalid token" },
          409: { description: "Username already taken" },
          422: { description: "Validation error" }
        }
      }
    }

  },
}