import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { tenantMiddleware, requireCompany } from '../middleware/tenantMiddleware.js';
import {
  getProfile,
  updateProfile,
  changePassword,
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
} from '../controllers/userController.js';

const router = express.Router();

// Aplicar middlewares em todas as rotas
router.use(authMiddleware);
router.use(tenantMiddleware);

// Rotas para o perfil do usuário logado
router.get('/me', getProfile);
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);

// Rotas para gerenciamento de usuários (apenas administradores)
router.get('/', getUsers);
router.post('/', createUser);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
