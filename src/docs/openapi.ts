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
    },
    "/user/profile": {
      patch: {
        tags: ["User"],
        summary: "Update user profile and notification preferences",
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
                  notifications_enabled: {
                    type: "boolean",
                    example: true
                  },
                  reminder_start_hour: {
                    type: "integer",
                    minimum: 6,
                    maximum: 22,
                    example: 8,
                    description: "Hour in 24h format (6-22)"
                  },
                  reminder_end_hour: {
                    type: "integer",
                    minimum: 6,
                    maximum: 22,
                    example: 21,
                    description: "Must be greater than reminder_start_hour"
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
                    avatar_url: { type: "string", nullable: true },
                    notifications_enabled: { type: "boolean" },
                    reminder_start_hour: { type: "integer" },
                    reminder_end_hour: { type: "integer" },
                    onboarding_completed: { type: "boolean" }
                  }
                }
              }
            }
          },
          401: { description: "Missing or invalid token" },
          409: { description: "Username already taken" },
          422: { description: "Validation error or invalid hour range" }
        }
      }
    },
    "/rooms": {
      post: {
        tags: ["Rooms"],
        summary: "Create a room",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string", example: "Sala" },
                  size_m2: { type: "number", example: 20.5 },
                  light_level: { type: "string", enum: ["low", "medium", "high"], example: "medium" }
                }
              }
            }
          }
        },
        responses: {
          201: { description: "Room created" },
          401: { description: "Unauthorized" },
          422: { description: "Validation error" }
        }
      },
      get: {
        tags: ["Rooms"],
        summary: "Get all rooms for the authenticated user",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "List of rooms" },
          401: { description: "Unauthorized" }
        }
      }
    },
    "/rooms/{id}": {
      get: {
        tags: ["Rooms"],
        summary: "Get a room by ID",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Room found" },
          401: { description: "Unauthorized" },
          404: { description: "Room not found" }
        }
      },
      patch: {
        tags: ["Rooms"],
        summary: "Update a room",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  size_m2: { type: "number" },
                  light_level: { type: "string", enum: ["low", "medium", "high"] }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Room updated" },
          401: { description: "Unauthorized" },
          404: { description: "Room not found" },
          422: { description: "Validation error" }
        }
      },
      delete: {
        tags: ["Rooms"],
        summary: "Delete a room (soft delete)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          204: { description: "Room deleted" },
          401: { description: "Unauthorized" },
          404: { description: "Room not found" }
        }
      }
    },
    "/plants/species": {
      get: {
        tags: ["Plants"],
        summary: "Get all plant species",
        description: "Public endpoint — returns the full species catalog.",
        responses: {
          200: {
            description: "List of species",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      scientific_name: { type: "string" },
                      common_name: { type: "string" },
                      category: { type: "string", enum: ["tropical", "succulent", "cactus", "fern", "flowering", "herb", "tree", "other"] },
                      light_requirement: { type: "string", enum: ["low", "medium", "high", "indirect"] },
                      water_frequency_days: { type: "integer" },
                      humidity_preference: { type: "string", enum: ["low", "medium", "high"] },
                      air_purification_score: { type: "integer" },
                      min_temperature: { type: "integer" },
                      max_temperature: { type: "integer" },
                      created_at: { type: "string", format: "date-time" }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/plants/species/{id}": {
      get: {
        tags: ["Plants"],
        summary: "Get a species by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Species found" },
          404: { description: "Species not found" }
        }
      }
    },
    "/plants": {
      post: {
        tags: ["Plants"],
        summary: "Add a plant to user collection",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["species_id"],
                properties: {
                  species_id: { type: "string", format: "uuid", example: "123e4567-e89b-12d3-a456-426614174000" },
                  nickname: { type: "string", maxLength: 50, example: "Mi Monstera" },
                  health_status: { type: "string", enum: ["excellent", "good", "fair", "poor", "critical"], example: "good" },
                  acquired_at: { type: "string", format: "date-time" }
                }
              }
            }
          }
        },
        responses: {
          201: { description: "Plant added to collection" },
          401: { description: "Unauthorized" },
          404: { description: "Species not found" },
          422: { description: "Validation error" }
        }
      },
      get: {
        tags: ["Plants"],
        summary: "Get all plants in user collection",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "List of user plants with species info" },
          401: { description: "Unauthorized" }
        }
      }
    },
    "/plants/{id}": {
      get: {
        tags: ["Plants"],
        summary: "Get a plant by ID",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Plant found" },
          401: { description: "Unauthorized" },
          404: { description: "Plant not found" }
        }
      },
      patch: {
        tags: ["Plants"],
        summary: "Update a plant",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  nickname: { type: "string", maxLength: 50 },
                  health_status: { type: "string", enum: ["excellent", "good", "fair", "poor", "critical"] },
                  last_watered_at: { type: "string", format: "date-time" }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Plant updated" },
          401: { description: "Unauthorized" },
          404: { description: "Plant not found" },
          422: { description: "Validation error" }
        }
      },
      delete: {
        tags: ["Plants"],
        summary: "Remove a plant from collection (soft delete)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          204: { description: "Plant removed" },
          401: { description: "Unauthorized" },
          404: { description: "Plant not found" }
        }
      }
    }

  },
}