/**
 * BookShelf REST API Client
 * Interacts with Node.js/Express backend on port 5000
 */
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && window.location.port === '5000'
    ? window.location.origin
    : 'http://localhost:5000');

class ApiService {
  constructor(baseUrl = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const defaultHeaders = {};

    if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
      defaultHeaders['Content-Type'] = 'application/json';
      options.body = JSON.stringify(options.body);
    }

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      if (response.status === 204) {
        return null;
      }

      const isJson = response.headers.get('content-type')?.includes('application/json');
      const data = isJson ? await response.json() : await response.text();

      if (!response.ok) {
        const message =
          (typeof data === 'object' && (data.message || data.error)) ||
          (typeof data === 'string' && data) ||
          `HTTP error ${response.status}`;
        const error = new Error(message);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (err) {
      if (err.name === 'AbortError') {
        throw err;
      }
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        const netErr = new Error(
          'Cannot connect to backend server. Please verify Node.js is running on port 5000.'
        );
        netErr.status = 0;
        throw netErr;
      }
      throw err;
    }
  }

  // --- BOOKS ---
  async getBooks(
    { page = 1, limit = 8, genre = '', search = '', sort = '', signal } = {},
    options = {}
  ) {
    const params = new URLSearchParams();
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);
    if (genre && genre !== 'All Genres') params.append('genre', genre);
    if (search && search.trim()) params.append('search', search.trim());
    if (sort) params.append('sort', sort);

    const qs = params.toString();
    const requestOptions = {
      ...options,
      ...(signal ? { signal } : {}),
    };
    return this.request(`/books${qs ? `?${qs}` : ''}`, requestOptions);
  }

  async getBook(id, options = {}) {
    return this.request(`/books/${id}`, options);
  }

  async createBook(bookData, options = {}) {
    return this.request('/books', {
      ...options,
      method: 'POST',
      body: bookData,
    });
  }

  async updateBook(id, bookData, options = {}) {
    return this.request(`/books/${id}`, {
      ...options,
      method: 'PUT',
      body: bookData,
    });
  }

  async deleteBook(id, options = {}) {
    return this.request(`/books/${id}`, {
      ...options,
      method: 'DELETE',
    });
  }

  // --- AUTHORS ---
  async getAuthors(
    { page = 1, limit = 10, search = '', sort = '', signal } = {},
    options = {}
  ) {
    const params = new URLSearchParams();
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);
    if (search && search.trim()) params.append('search', search.trim());
    if (sort) params.append('sort', sort);

    const qs = params.toString();
    const requestOptions = {
      ...options,
      ...(signal ? { signal } : {}),
    };
    return this.request(`/authors${qs ? `?${qs}` : ''}`, requestOptions);
  }

  async getAuthor(id, options = {}) {
    return this.request(`/authors/${id}`, options);
  }

  async createAuthor(authorData) {
    return this.request('/authors', {
      method: 'POST',
      body: authorData,
    });
  }

  async updateAuthor(id, authorData) {
    return this.request(`/authors/${id}`, {
      method: 'PUT',
      body: authorData,
    });
  }

  async deleteAuthor(id) {
    return this.request(`/authors/${id}`, {
      method: 'DELETE',
    });
  }

  // --- UPLOAD ---
  async uploadCover(file) {
    const formData = new FormData();
    formData.append('cover', file);
    return this.request('/upload', {
      method: 'POST',
      body: formData,
    });
  }
}

export const api = new ApiService();
