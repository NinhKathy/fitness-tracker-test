const request = require('supertest');
const express = require('express');
const mockingoose = require('mockingoose');
const { WorkoutPlan } = require('../models/workoutPlan.model'); 
const { workoutPlanRouter } = require('../routes/workoutPlan.router'); 
const { authenticateTrainer } = require('../middleware/TrainerAuth'); // Mock if necessary
require('dotenv').config();

// Set up a mock Express app for testing
const app = express();
app.use(express.json());
app.use('/api/workoutPlans', workoutPlanRouter); // Mount the workoutPlanRouter

// Mock authenticateTrainer middleware if necessary
jest.mock('../middleware/TrainerAuth', () => ({
  authenticateTrainer: jest.fn((req, res, next) => next()), // Just call next() for tests
}));

describe('Workout Plan Routes', () => {
  afterEach(() => {
    // Reset mockingoose after each test
    mockingoose.resetAll(); 
    // Clear all mocks
    jest.clearAllMocks(); 
  });

  describe('POST /createPlan', () => {
    it('should create a new workout plan and return it', async () => {
      const newPlan = {
        planName: 'Fat Loss Plan',
        goal: 'Fat loss',
        duration: '4 weeks',
        description: 'A plan to lose fat in 4 weeks.',
        trainerId: 'trainer123',
      };

      // Mock the save method for WorkoutPlan
      mockingoose(WorkoutPlan).toReturn(newPlan, 'save');

      const response = await request(app)
        .post('/api/workoutPlans/createPlan')
        .send(newPlan);

      expect(response.status).toBe(201);
      expect(response.body.planName).toBe('Fat Loss Plan');
      expect(response.body.goal).toBe('Fat loss');
    });

    it('should return error if workout plan creation fails', async () => {
      const newPlan = {
        planName: 'Strength Training Plan',
        goal: 'Strength building',
        duration: '8 weeks',
        description: 'A plan to build strength in 8 weeks.',
      };

      // Simulate an error in the save method
      mockingoose(WorkoutPlan).toReturn(new Error('Error saving plan'), 'save');

      const response = await request(app)
        .post('/api/workoutPlans/createPlan')
        .send(newPlan);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Error creating workout plan');
    });
  });

  describe('GET /workoutPlans', () => {
    it('should fetch all workout plans', async () => {
      const workoutPlans = [
        {
          _id: '60c72b2f5f1b2c001f58eb1e',
          planName: 'Fat Loss Plan',
          goal: 'Fat loss',
          duration: '4 weeks',
          description: 'A plan to lose fat in 4 weeks.',
        },
        {
          _id: '60c72b2f5f1b2c001f58eb1f',
          planName: 'Strength Plan',
          goal: 'Strength building',
          duration: '8 weeks',
          description: 'A plan to build strength in 8 weeks.',
        },
      ];

      // Mock the find method to return the workoutPlans
      mockingoose(WorkoutPlan).toReturn(workoutPlans, 'find');

      const response = await request(app).get('/api/workoutPlans/workoutPlans');

      expect(response.status).toBe(200);
      expect(response.body.length).toBe(2); // Ensure 2 workout plans are returned
      expect(response.body[0].planName).toBe('Fat Loss Plan');
      expect(response.body[1].planName).toBe('Strength Plan');
    });

    it('should return error if workout plans fetch fails', async () => {
      // Simulate an error in the find method
      mockingoose(WorkoutPlan).toReturn(new Error('Error fetching plans'), 'find');

      const response = await request(app).get('/api/workoutPlans/workoutPlans');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Error fetching workout plans');
    });
  });
});