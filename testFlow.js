const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
let token = '';
let contactId = '';
let noteId = '';

async function registerUser() {
  console.log('📨 Registering user...');
  await axios.post(`${BASE_URL}/auth/register`, {
    email: 'user@example.com',
    password: 'password123'
  });
  console.log('User registered');
}

async function loginUser() {
  const res = await axios.post(`${BASE_URL}/auth/login`, {
    email: 'user@example.com',
    password: 'password123'
  });
  
  console.log('🔍 Full login response:', res.data);
  token = res.data.token || res.data.accessToken || res.data.jwt;
  console.log('Logged in. JWT:', token);
}

async function createContact() {
  console.log('👤 Creating contact...');
  const res = await axios.post(`${BASE_URL}/contacts`, {
    name: 'John Doe',
    email: 'john@example.com'
  }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  contactId = res.data.id;
  console.log('Contact created:', contactId);
}

async function createNote() {
  console.log('📝 Creating note...');
  const res = await axios.post(`${BASE_URL}/contacts/${contactId}/notes`, {
    body: 'This is a test note'
  }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  noteId = res.data.id;
  console.log('Note created:', noteId);
}

async function getNotes() {
  console.log('📚 Fetching notes...');
  const res = await axios.get(`${BASE_URL}/contacts/${contactId}/notes`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('Notes fetched:', res.data);
}

async function deleteNote() {
  console.log('Deleting note...');
  await axios.delete(`${BASE_URL}/contacts/${contactId}/notes/${noteId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log('Note deleted');
}

(async () => {
  try {
    await registerUser();
    await loginUser();
    await createContact();
    await createNote();
    await getNotes();
    await deleteNote();
  } catch (err) {
    console.error('Error:', err.response?.data || err.message);
  }
})();