"use strict";

/**
 * File: error-messages.ts
 * Description: Error message translator converting technical error codes and messages
 * to user-friendly messages in Portuguese. Provides centralized error message management.
 * Responsibilities:
 *   - Define AUTH_ERROR_MESSAGES map for authentication error codes
 *   - Define API_ERROR_MESSAGES map for API error messages
 *   - Provide getAuthErrorMessage() to translate auth error codes
 *   - Provide getApiErrorMessage() to translate API error messages
 *   - Provide extractErrorMessage() to extract error text from various error formats
 *   - Support fallback to default messages when error code not found
 *   - Support passthrough of unknown API error messages
 *   - Handle NextAuth error formats (CredentialsSignin, SessionRequired)
 *   - Handle standard Error objects and API response errors
 * Called by:
 *   - api-client.ts (API error translation)
 *   - pages/login.tsx (authentication error display)
 *   - pages/forgot-password.tsx (password reset error display)
 *   - All API route handlers for error response formatting
 *   - Components displaying error messages to users
 * Notes:
 *   - All messages are in Portuguese (pt-BR)
 *   - Returns default message if error code/message not found
 *   - getApiErrorMessage passes through unknown messages (for dynamic errors)
 *   - getAuthErrorMessage always returns predefined message (for security)
 *   - extractErrorMessage handles multiple error object formats
 *   - Supports NextAuth, standard Error, and API response formats
 */

/**
 * Authentication error messages map.
 * Maps error codes to user-friendly Portuguese messages.
 */
export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  // Custom authentication errors from auth-config.ts
  MISSING_CREDENTIALS: "Por favor, preencha email e senha",
  USER_NOT_FOUND: "Email não encontrado no sistema",
  INVALID_PASSWORD: "Senha incorreta",
  INVALID_ACCOUNT: "Conta inválida ou sem senha configurada",

  // NextAuth.js built-in error codes
  CredentialsSignin: "Email ou senha incorretos",
  SessionRequired: "Sessão expirada. Faça login novamente",

  // Default fallback message
  default: "Erro de autenticação. Tente novamente",
};

/**
 * API error messages map.
 * Maps error messages to user-friendly Portuguese messages.
 */
export const API_ERROR_MESSAGES: Record<string, string> = {
  // Common HTTP and validation errors
  VALIDATION_ERROR: "Dados inválidos. Verifique os campos",
  NOT_FOUND: "Recurso não encontrado",
  UNAUTHORIZED: "Você não tem permissão para esta ação",
  INTERNAL_ERROR: "Erro interno do servidor. Tente novamente mais tarde",

  // Specific API error messages
  "Description is required.": "A descrição é obrigatória",
  "Training sheet ID is required": "ID da ficha de treino é obrigatório",
  "Training sheet not found": "Ficha de treino não encontrada",
  "Validation error": "Erro de validação nos dados enviados",
  "Internal server error": "Erro interno do servidor",
  "Method not allowed": "Método não permitido",

  // Default fallback message
  default: "Ocorreu um erro. Tente novamente",
};

/**
 * Validates if a value is a non-empty string.
 * @param value - Value to validate
 * @returns True if value is a valid non-empty string
 */
function isValidString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Validates if a value is a non-null object.
 * @param value - Value to validate
 * @returns True if value is an object
 */
function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

/**
 * Safely retrieves a string property from an object.
 * @param obj - Object to retrieve from
 * @param key - Property key
 * @returns String value or undefined
 */
function getStringProperty(
  obj: Record<string, unknown>,
  key: string
): string | undefined {
  const value = obj[key];
  return isValidString(value) ? value : undefined;
}

/**
 * Safely retrieves nested response.data.error from error object.
 * @param error - Error object
 * @returns Error message or undefined
 */
function getNestedResponseError(
  error: Record<string, unknown>
): string | undefined {
  const response = error.response;

  if (!isObject(response)) {
    return undefined;
  }

  const data = response.data;

  if (!isObject(data)) {
    return undefined;
  }

  return getStringProperty(data, "error");
}

/**
 * Translates authentication error codes to user-friendly Portuguese messages.
 * Always returns a predefined message for security (never exposes raw error codes).
 *
 * @param errorCode - Authentication error code
 * @returns User-friendly error message in Portuguese
 *
 * @example
 * ```ts
 * const message = getAuthErrorMessage('INVALID_PASSWORD');
 * // Returns: "Senha incorreta"
 * ```
 *
 * @example
 * ```ts
 * const message = getAuthErrorMessage(undefined);
 * // Returns: "Erro de autenticação. Tente novamente"
 * ```
 */
export function getAuthErrorMessage(errorCode: string | undefined): string {
  // Return default for missing error code
  if (!isValidString(errorCode)) {
    return AUTH_ERROR_MESSAGES.default;
  }

  const trimmedCode = errorCode.trim();

  // Look up message in map, fallback to default
  return AUTH_ERROR_MESSAGES[trimmedCode] || AUTH_ERROR_MESSAGES.default;
}

/**
 * Translates API error messages to user-friendly Portuguese messages.
 * Passes through unknown messages (allows dynamic error messages from API).
 *
 * @param errorMessage - API error message
 * @returns User-friendly error message in Portuguese
 *
 * @example
 * ```ts
 * const message = getApiErrorMessage('Validation error');
 * // Returns: "Erro de validação nos dados enviados"
 * ```
 *
 * @example
 * ```ts
 * const message = getApiErrorMessage('Custom error from API');
 * // Returns: "Custom error from API" (passthrough)
 * ```
 */
export function getApiErrorMessage(errorMessage: string | undefined): string {
  // Return default for missing error message
  if (!isValidString(errorMessage)) {
    return API_ERROR_MESSAGES.default;
  }

  const trimmedMessage = errorMessage.trim();

  // Look up message in map, fallback to original message (passthrough)
  return API_ERROR_MESSAGES[trimmedMessage] || trimmedMessage;
}

/**
 * Extracts error message from various error object formats.
 * Handles string errors, standard Error objects, NextAuth errors, and API response errors.
 *
 * @param error - Error in any format
 * @returns Extracted error message
 *
 * @example
 * ```ts
 * // String error
 * extractErrorMessage('Something went wrong');
 * // Returns: "Something went wrong"
 * ```
 *
 * @example
 * ```ts
 * // Standard Error object
 * extractErrorMessage(new Error('Failed'));
 * // Returns: "Failed"
 * ```
 *
 * @example
 * ```ts
 * // API response error
 * extractErrorMessage({ response: { data: { error: 'Not found' } } });
 * // Returns: "Not found"
 * ```
 */
export function extractErrorMessage(error: unknown): string {
  // Handle string errors directly
  if (isValidString(error)) {
    return error.trim();
  }

  // Handle object errors
  if (!isObject(error)) {
    return "Erro desconhecido";
  }

  // Try NextAuth error format: { error: "..." }
  const nextAuthError = getStringProperty(error, "error");
  if (nextAuthError) {
    return nextAuthError;
  }

  // Try standard Error object: { message: "..." }
  const standardError = getStringProperty(error, "message");
  if (standardError) {
    return standardError;
  }

  // Try API response format: { response: { data: { error: "..." } } }
  const apiResponseError = getNestedResponseError(error);
  if (apiResponseError) {
    return apiResponseError;
  }

  // Default fallback
  return "Erro desconhecido";
}
