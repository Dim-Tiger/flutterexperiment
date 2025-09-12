import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import 'auth_service.dart';

class ApiResponse<T> {
  final bool success;
  final T? data;
  final String? message;
  final String? error;
  final int statusCode;

  ApiResponse({
    required this.success,
    this.data,
    this.message,
    this.error,
    required this.statusCode,
  });

  factory ApiResponse.success(T data, {String? message, int statusCode = 200}) {
    return ApiResponse(
      success: true,
      data: data,
      message: message,
      statusCode: statusCode,
    );
  }

  factory ApiResponse.error(String error, {int statusCode = 500}) {
    return ApiResponse(
      success: false,
      error: error,
      statusCode: statusCode,
    );
  }
}

class HttpService {
  static final HttpService _instance = HttpService._internal();
  factory HttpService() => _instance;
  HttpService._internal();

  final http.Client _client = http.Client();
  final AuthService _authService = AuthService();

  /// Get request headers with authentication token
  Future<Map<String, String>> _getHeaders({bool includeAuth = true}) async {
    final headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (includeAuth) {
      final token = await _authService.getToken();
      if (token != null) {
        headers['Authorization'] = 'Bearer $token';
      }
    }

    return headers;
  }

  /// Handle HTTP response and create ApiResponse
  ApiResponse<T> _handleResponse<T>(
    http.Response response,
    T Function(Map<String, dynamic>) fromJson,
  ) {
    try {
      final responseData = json.decode(response.body) as Map<String, dynamic>;

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return ApiResponse.success(
          fromJson(responseData),
          message: responseData['message'],
          statusCode: response.statusCode,
        );
      } else {
        return ApiResponse.error(
          responseData['message'] ?? 'An error occurred',
          statusCode: response.statusCode,
        );
      }
    } catch (e) {
      return ApiResponse.error(
        'Failed to parse response: $e',
        statusCode: response.statusCode,
      );
    }
  }

  /// Handle HTTP response for list data
  ApiResponse<List<T>> _handleListResponse<T>(
    http.Response response,
    T Function(Map<String, dynamic>) fromJson,
  ) {
    try {
      final responseData = json.decode(response.body) as Map<String, dynamic>;

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final dataList = responseData['data'] as List?;
        if (dataList != null) {
          final items = dataList
              .map((item) => fromJson(item as Map<String, dynamic>))
              .toList();
          return ApiResponse.success(
            items,
            message: responseData['message'],
            statusCode: response.statusCode,
          );
        } else {
          return ApiResponse.success(
            <T>[],
            message: responseData['message'],
            statusCode: response.statusCode,
          );
        }
      } else {
        return ApiResponse.error(
          responseData['message'] ?? 'An error occurred',
          statusCode: response.statusCode,
        );
      }
    } catch (e) {
      return ApiResponse.error(
        'Failed to parse response: $e',
        statusCode: response.statusCode,
      );
    }
  }

  /// Generic GET request
  Future<ApiResponse<T>> get<T>(
    String endpoint,
    T Function(Map<String, dynamic>) fromJson, {
    Map<String, String>? queryParams,
    bool includeAuth = true,
  }) async {
    try {
      final uri = Uri.parse('${ApiConfig.baseUrl}$endpoint');
      final finalUri = queryParams != null 
          ? uri.replace(queryParameters: queryParams)
          : uri;

      final headers = await _getHeaders(includeAuth: includeAuth);
      
      final response = await _client
          .get(finalUri, headers: headers)
          .timeout(ApiConfig.receiveTimeout);

      return _handleResponse(response, fromJson);
    } on SocketException {
      return ApiResponse.error('No internet connection');
    } on HttpException {
      return ApiResponse.error('Network error occurred');
    } on FormatException {
      return ApiResponse.error('Invalid response format');
    } catch (e) {
      return ApiResponse.error('Request failed: $e');
    }
  }

  /// Generic GET request for lists
  Future<ApiResponse<List<T>>> getList<T>(
    String endpoint,
    T Function(Map<String, dynamic>) fromJson, {
    Map<String, String>? queryParams,
    bool includeAuth = true,
  }) async {
    try {
      final uri = Uri.parse('${ApiConfig.baseUrl}$endpoint');
      final finalUri = queryParams != null 
          ? uri.replace(queryParameters: queryParams)
          : uri;

      final headers = await _getHeaders(includeAuth: includeAuth);
      
      final response = await _client
          .get(finalUri, headers: headers)
          .timeout(ApiConfig.receiveTimeout);

      return _handleListResponse(response, fromJson);
    } on SocketException {
      return ApiResponse.error('No internet connection');
    } on HttpException {
      return ApiResponse.error('Network error occurred');
    } on FormatException {
      return ApiResponse.error('Invalid response format');
    } catch (e) {
      return ApiResponse.error('Request failed: $e');
    }
  }

  /// Generic POST request
  Future<ApiResponse<T>> post<T>(
    String endpoint,
    Map<String, dynamic> data,
    T Function(Map<String, dynamic>) fromJson, {
    bool includeAuth = true,
  }) async {
    try {
      final uri = Uri.parse('${ApiConfig.baseUrl}$endpoint');
      final headers = await _getHeaders(includeAuth: includeAuth);
      
      final response = await _client
          .post(uri, headers: headers, body: json.encode(data))
          .timeout(ApiConfig.receiveTimeout);

      return _handleResponse(response, fromJson);
    } on SocketException {
      return ApiResponse.error('No internet connection');
    } on HttpException {
      return ApiResponse.error('Network error occurred');
    } on FormatException {
      return ApiResponse.error('Invalid response format');
    } catch (e) {
      return ApiResponse.error('Request failed: $e');
    }
  }

  /// Generic PUT request
  Future<ApiResponse<T>> put<T>(
    String endpoint,
    Map<String, dynamic> data,
    T Function(Map<String, dynamic>) fromJson, {
    bool includeAuth = true,
  }) async {
    try {
      final uri = Uri.parse('${ApiConfig.baseUrl}$endpoint');
      final headers = await _getHeaders(includeAuth: includeAuth);
      
      final response = await _client
          .put(uri, headers: headers, body: json.encode(data))
          .timeout(ApiConfig.receiveTimeout);

      return _handleResponse(response, fromJson);
    } on SocketException {
      return ApiResponse.error('No internet connection');
    } on HttpException {
      return ApiResponse.error('Network error occurred');
    } on FormatException {
      return ApiResponse.error('Invalid response format');
    } catch (e) {
      return ApiResponse.error('Request failed: $e');
    }
  }

  /// Generic DELETE request
  Future<ApiResponse<Map<String, dynamic>>> delete(
    String endpoint, {
    bool includeAuth = true,
  }) async {
    try {
      final uri = Uri.parse('${ApiConfig.baseUrl}$endpoint');
      final headers = await _getHeaders(includeAuth: includeAuth);
      
      final response = await _client
          .delete(uri, headers: headers)
          .timeout(ApiConfig.receiveTimeout);

      return _handleResponse(response, (data) => data);
    } on SocketException {
      return ApiResponse.error('No internet connection');
    } on HttpException {
      return ApiResponse.error('Network error occurred');
    } on FormatException {
      return ApiResponse.error('Invalid response format');
    } catch (e) {
      return ApiResponse.error('Request failed: $e');
    }
  }

  /// Upload file with multipart request
  Future<ApiResponse<T>> uploadFile<T>(
    String endpoint,
    String filePath,
    String fieldName,
    T Function(Map<String, dynamic>) fromJson, {
    Map<String, String>? additionalFields,
    bool includeAuth = true,
  }) async {
    try {
      final uri = Uri.parse('${ApiConfig.baseUrl}$endpoint');
      final request = http.MultipartRequest('POST', uri);
      
      // Add headers
      final headers = await _getHeaders(includeAuth: includeAuth);
      request.headers.addAll(headers);
      
      // Add file
      final file = await http.MultipartFile.fromPath(fieldName, filePath);
      request.files.add(file);
      
      // Add additional fields
      if (additionalFields != null) {
        request.fields.addAll(additionalFields);
      }
      
      final streamedResponse = await request.send().timeout(ApiConfig.receiveTimeout);
      final response = await http.Response.fromStream(streamedResponse);
      
      return _handleResponse(response, fromJson);
    } on SocketException {
      return ApiResponse.error('No internet connection');
    } on HttpException {
      return ApiResponse.error('Network error occurred');
    } on FormatException {
      return ApiResponse.error('Invalid response format');
    } catch (e) {
      return ApiResponse.error('Upload failed: $e');
    }
  }

  /// Close the HTTP client
  void dispose() {
    _client.close();
  }
}