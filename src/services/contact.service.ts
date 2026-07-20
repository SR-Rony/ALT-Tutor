import { apiClient } from "./api-client";

export type ContactFormPayload = {
  name: string;
  email?: string;
  phone?: string;
  message: string;
};

export type ContactSubmission = ContactFormPayload & {
  id: string;
  createdAt: string;
};

export const contactService = {
  submit(payload: ContactFormPayload) {
    return apiClient.post<ContactSubmission>("/contact", payload).then((response) => response.data);
  },
};
