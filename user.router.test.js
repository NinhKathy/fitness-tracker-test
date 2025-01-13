const request = require('supertest');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = require('../app'); 
const mockingoose = require('mockingoose');
const { User } = require('../models/user.model'); // User model

// Helper function that generates mock token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.SECRET_KEY);
};

describe('User Routes', () => {
  afterEach(() => {
    mockingoose.resetAll(); // Resets mockingoose after each test
  });

  describe('POST /signup', () => {
    it('should create a new user and return success message', async () => {
      const newUser = {
        name: 'John Doe',
        age: 30,
        gender: 'Male',
        height: 180,
        weight: 75,
        email: 'john.doe@example.com',
        contactNumber: '1234567890',
        password: 'password123',
      };

      mockingoose(User).toReturn(null, 'save'); 
      // Mocking the save function of the User model

      const response = await request(app)
        .post('/signup')
        .send(newUser);

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('User registered successfully');
    });

    it('should return error if user registration fails', async () => {
      const newUser = {
        name: 'Jane Doe',
        age: 25,
        gender: 'Female',
        height: 165,
        weight: 60,
        email: 'jane.doe@example.com',
        contactNumber: '0987654321',
        password: 'password123',
      };

      mockingoose(User).toReturn(new Error('Error while saving'), 'save'); // Simulating an error during save

      const response = await request(app)
        .post('/signup')
        .send(newUser);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Failed to register user');
    });
  });

  describe('POST /login', () => {
    it('should login successfully with valid credentials', async () => {
      const user = {
        _id: '60c72b2f5f1b2c001f58eb1e',
        email: 'john.doe@example.com',
        password: await bcrypt.hash('password123', 10), // hash password
      };

      // Mocks User.findOne to return a mock user
      mockingoose(User).toReturn(user, 'findOne');

      const response = await request(app)
        .post('/login')
        .send({
          email: 'john.doe@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Login Successful');
      expect(response.body.token).toBeDefined();
    });

    it('should return error if user not found', async () => {
      mockingoose(User).toReturn(null, 'findOne'); // Simulating no user found

      const response = await request(app)
        .post('/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authentication failed');
    });

    it('should return error if password is incorrect', async () => {
      const user = {
        _id: '60c72b2f5f1b2c001f58eb1e',
        email: 'john.doe@example.com',
        password: await bcrypt.hash('password123', 10),
      };

      mockingoose(User).toReturn(user, 'findOne'); // Simulating found user

      const response = await request(app)
        .post('/login')
        .send({
          email: 'john.doe@example.com',
          password: 'incorrectpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Authentication failed');
    });

    it('should return error if login fails', async () => {
      mockingoose(User).toReturn(new Error('Error while finding user'), 'findOne'); // Simulating error during find

      const response = await request(app)
        .post('/login')
        .send({
          email: 'john.doe@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Authentication failed');
    });
  });
});