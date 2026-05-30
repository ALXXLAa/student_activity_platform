import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3006/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

export interface Event {
  id: number;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  location: string;
  organizer: string;
  max_participants: number;
  status: 'active' | 'pending' | 'completed';
  created_by: number;
  created_at: string;
  updated_at: string;
  username?: string;
}

export interface CreateEventRequest {
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  location: string;
  organizer: string;
  max_participants: number;
}

export interface Registration {
  id: number;
  event_id: number;
  user_id: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  event?: Event;
  username?: string;
}

export interface Comment {
  id: number;
  event_id: number;
  user_id: number;
  content: string;
  created_at: string;
  username?: string;
}

export interface Favorite {
  id: number;
  event_id: number;
  user_id: number;
  created_at: string;
  event?: Event;
}

export const getEvents = async (): Promise<Event[]> => {
  return api.get('/events');
};

export const getEventById = async (id: number): Promise<Event> => {
  return api.get(`/events/${id}`);
};

export const createEvent = async (data: CreateEventRequest): Promise<Event> => {
  return api.post('/events', data);
};

export const updateEvent = async (id: number, data: Partial<CreateEventRequest>): Promise<Event> => {
  return api.put(`/events/${id}`, data);
};

export const deleteEvent = async (id: number): Promise<void> => {
  return api.delete(`/events/${id}`);
};

export const updateEventStatus = async (id: number, status: 'active' | 'pending' | 'completed'): Promise<Event> => {
  return api.put(`/events/${id}/status`, { status });
};

export const getMyEvents = async (): Promise<Event[]> => {
  return api.get('/events/my');
};

export const registerEvent = async (eventId: number): Promise<Registration> => {
  return api.post(`/events/${eventId}/register`);
};

export const getRegistrations = async (eventId?: number): Promise<Registration[]> => {
  if (eventId) {
    return api.get(`/events/${eventId}/registrations`);
  }
  return api.get('/registrations/my');
};

export const updateRegistrationStatus = async (registrationId: number, status: 'approved' | 'rejected'): Promise<Registration> => {
  return api.put(`/registrations/${registrationId}`, { status });
};

export const cancelRegistration = async (registrationId: number): Promise<void> => {
  return api.delete(`/registrations/${registrationId}`);
};

export const addFavorite = async (eventId: number): Promise<Favorite> => {
  return api.post(`/events/${eventId}/favorite`);
};

export const removeFavorite = async (eventId: number): Promise<void> => {
  return api.delete(`/events/${eventId}/favorite`);
};

export const getFavorites = async (): Promise<Favorite[]> => {
  return api.get('/favorites/my');
};

export const checkFavorite = async (eventId: number): Promise<{ isFavorite: boolean }> => {
  return api.get(`/events/${eventId}/favorite/check`);
};

export const getComments = async (eventId: number): Promise<Comment[]> => {
  return api.get(`/events/${eventId}/comments`);
};

export const addComment = async (eventId: number, content: string): Promise<Comment> => {
  return api.post(`/events/${eventId}/comments`, { content });
};

export const deleteComment = async (commentId: number): Promise<void> => {
  return api.delete(`/comments/${commentId}`);
};
