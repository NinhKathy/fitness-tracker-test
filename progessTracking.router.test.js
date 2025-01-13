import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProgressTracking from './progessTracking.router';
import '@testing-library/jest-dom/extend-expect';
import userEvent from '@testing-library/user-event';

// Mocks localStorage.getItem for the tests
beforeEach(() => {
  localStorage.setItem('authTokenUser', 'mock-auth-token');
});

afterEach(() => {
  jest.clearAllMocks();
});

jest.mock('window', () => ({
  fetch: jest.fn(),
}));

// Mocks the fetch function for API calls
const mockFetch = window.fetch;

describe('ProgressTracking Component', () => {
  test('renders form inputs and button', () => {
    render(<ProgressTracking />);

    // Checks if form elements are rendered
    expect(screen.getByLabelText(/Date:/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Weight \(in kg\):/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Body Measurements:/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Notes:/i)).toBeInTheDocument();
    expect(screen.getByText(/Track Progress/i)).toBeInTheDocument();
  });

  test('handles input change correctly', () => {
    render(<ProgressTracking />);

    const dateInput = screen.getByLabelText(/Date:/i);
    const weightInput = screen.getByLabelText(/Weight \(in kg\):/i);
    const bodyMeasurementsInput = screen.getByLabelText(/Body Measurements:/i);
    const notesInput = screen.getByLabelText(/Notes:/i);

    // Simulates user input
    userEvent.type(dateInput, '2025-01-09');
    userEvent.type(weightInput, '70');
    userEvent.type(bodyMeasurementsInput, 'Chest: 100cm, Waist: 80cm');
    userEvent.type(notesInput, 'Feeling good!');

    // Checks that the inputs have the correct values
    expect(dateInput).toHaveValue('2025-01-09');
    expect(weightInput).toHaveValue('70');
    expect(bodyMeasurementsInput).toHaveValue('Chest: 100cm, Waist: 80cm');
    expect(notesInput).toHaveValue('Feeling good!');
  });

  test('calls the track progress API when form is submitted', async () => {
    render(<ProgressTracking />);

    // Mocks the response for fetch call
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [{ id: 1, date: '2025-01-09', weight: 70, bodyMeasurements: 'Chest: 100cm', notes: 'Feeling good' }],
    });

    const dateInput = screen.getByLabelText(/Date:/i);
    const weightInput = screen.getByLabelText(/Weight \(in kg\):/i);
    const bodyMeasurementsInput = screen.getByLabelText(/Body Measurements:/i);
    const notesInput = screen.getByLabelText(/Notes:/i);

    // Simulates user input
    userEvent.type(dateInput, '2025-01-09');
    userEvent.type(weightInput, '70');
    userEvent.type(bodyMeasurementsInput, 'Chest: 100cm');
    userEvent.type(notesInput, 'Feeling good!');

    const trackProgressButton = screen.getByText(/Track Progress/i);

    // Simulates form submission
    fireEvent.click(trackProgressButton);

    // Waits for fetch to be called
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2));  // One for tracking progress, one for fetching data

    // Checks that the second fetch call updates table with new data
    expect(await screen.findByText('2025-01-09')).toBeInTheDocument();
    expect(await screen.findByText('70 kg')).toBeInTheDocument();
    expect(await screen.findByText('Chest: 100cm')).toBeInTheDocument();
    expect(await screen.findByText('Feeling good!')).toBeInTheDocument();
  });

  test('displays progress data from API correctly', async () => {
    render(<ProgressTracking />);

    // Mocks the response for the fetch call that retrieves progress data
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          id: 1,
          date: '2025-01-09',
          weight: 70,
          bodyMeasurements: 'Chest: 100cm',
          notes: 'Feeling good!',
        },
      ],
    });

    // Waits for the progress data to be fetched and rendered
    await waitFor(() => expect(screen.getByText('2025-01-09')).toBeInTheDocument());
    expect(screen.getByText('70 kg')).toBeInTheDocument();
    expect(screen.getByText('Chest: 100cm')).toBeInTheDocument();
    expect(screen.getByText('Feeling good!')).toBeInTheDocument();
  });

  test('shows error message if API fetch fails', async () => {
    render(<ProgressTracking />);

    // Mocks the fetch to simulate an error response
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500, statusText: 'Internal Server Error' });

    const trackProgressButton = screen.getByText(/Track Progress/i);
    fireEvent.click(trackProgressButton);

    // Waits for the error to be logged
    await waitFor(() => expect(screen.queryByText('Failed to track progress')).toBeInTheDocument());
  });

  test('handles network error gracefully', async () => {
    render(<ProgressTracking />);

    // Mocks the fetch to simulate a network error
    mockFetch.mockRejectedValueOnce(new Error('Network Error'));

    const trackProgressButton = screen.getByText(/Track Progress/i);
    fireEvent.click(trackProgressButton);

    // Waits for the error to be logged
    await waitFor(() => expect(screen.queryByText('An error occurred')).toBeInTheDocument());
  });
});