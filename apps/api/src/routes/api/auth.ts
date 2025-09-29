import { Router, Request, Response, NextFunction } from 'express';
import { AuthService } from '../../services/authService';
import { body, validationResult } from 'express-validator';

const router: Router = Router();
const authService = new AuthService();

// Login validation middleware
const loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
];

// Register validation middleware
const registerValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('name').isLength({ min: 2 }).withMessage('Name must be at least 2 characters long'),
];

// Validation middleware
const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }
  next();
};

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user and return JWT tokens
 * @access  Public
 */
router.post('/login', loginValidation, validateRequest, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);

    res.json({
      success: true,
      data: result,
      message: 'Login successful',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', registerValidation, validateRequest, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, name, companyName } = req.body;
    const result = await authService.register({ email, password, name, companyName });

    res.status(201).json({
      success: true,
      data: result,
      message: 'Registration successful',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user (invalidate tokens)
 * @access  Private
 */
router.post('/logout', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      await authService.logout(token);
    }

    res.json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      });
    }

    const token = authHeader.substring(7);
    const user = await authService.getCurrentUser(token);

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
    }

    const result = await authService.refreshToken(refreshToken);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

export default router;