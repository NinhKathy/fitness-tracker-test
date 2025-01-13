const request = require('supertest');
const express = require('express');
const { fitnessGoalRouter } = require('./goal.router'); 
const { FitnessGoal } = require('../models/fitnessGoal.model');
const { authenticateUser } = require('../middleware/UserAuth');

// Create a test app for Express
const app = express();
app.use(express.json());
app.use(fitnessGoalRouter);

// Mock authentication middleware
jest.mock('../middleware/UserAuth', () => ({
  authenticateUser: (req, res, next) => {
    req.userId = 'mockUserId'; // simulate an authenticated user
    next();
  }
}));

// Tests
describe('Fitness Goal API routes', () => {

  // Test POST /fitnessGoals
  it('should create a new fitness goal', async () => {
    const goalData = {
      goalType: 'Weight Loss',
      target: 10,
      timeline: '3 months',
    };

    const response = await request(app)
      .post('/fitnessGoals')
      .send(goalData)
      .expect(200);

    expect(response.body.goalType).toBe('Weight Loss');
    expect(response.body.target).toBe(10);
    expect(response.body.timeline).toBe('3 months');
    expect(response.body.userId).toBe('mockUserId');
  });

  // Test GET /fitnessGoals
  it('should get all fitness goals', async () => {
    const response = await request(app)
      .get('/fitnessGoals')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });

  // Test GET /fitnessGoals/:id
  it('should get a fitness goal by ID', async () => {
    const newGoal = new FitnessGoal({
      goalType: 'Muscle Gain',
      target: 5,
      timeline: '6 months',
      userId: 'mockUserId',
    });
    await newGoal.save();

    const response = await request(app)
      .get(`/fitnessGoals/${newGoal._id}`)
      .expect(200);

    expect(response.body.goalType).toBe('Muscle Gain');
    expect(response.body.target).toBe(5);
  });

  it('should return 404 if fitness goal not found', async () => {
    const response = await request(app)
      .get('/fitnessGoals/60b6e9e8b6a12345678e9f99') // Invalid ID
      .expect(404);

    expect(response.body.error).toBe('Fitness goal not found');
  });

  // Test PATCH /fitnessGoals/:id
  it('should update a fitness goal by ID', async () => {
    const newGoal = new FitnessGoal({
      goalType: 'Endurance',
      target: 50,
      timeline: '6 months',
      userId: 'mockUserId',
    });
    await newGoal.save();

    const updatedGoalData = {
      target: 60,
      timeline: '7 months',
    };

    const response = await request(app)
      .patch(`/fitnessGoals/${newGoal._id}`)
      .send(updatedGoalData)
      .expect(200);

    expect(response.body.target).toBe(60);
    expect(response.body.timeline).toBe('7 months');
  });

  it('should return 404 if trying to update a non-existent goal', async () => {
    const response = await request(app)
      .patch('/fitnessGoals/60b6e9e8b6a12345678e9f99') // Invalid ID
      .send({ target: 100 })
      .expect(404);

    expect(response.body.error).toBe('Fitness goal not found');
  });

  // Test DELETE /fitnessGoals/:id
  it('should delete a fitness goal by ID', async () => {
    const newGoal = new FitnessGoal({
      goalType: 'Flexibility',
      target: 30,
      timeline: '3 months',
      userId: 'mockUserId',
    });
    await newGoal.save();

    const response = await request(app)
      .delete(`/fitnessGoals/${newGoal._id}`)
      .expect(200);

    expect(response.body.message).toBe('Fitness goal deleted');
  });

  it('should return 404 if trying to delete a non-existent goal', async () => {
    const response = await request(app)
      .delete('/fitnessGoals/60b6e9e8b6a12345678e9f99') // Invalid ID
      .expect(404);

    expect(response.body.error).toBe('Fitness goal not found');
  });
});