import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { requireMasterAdmin, tenantMiddleware } from '../middleware/tenantMiddleware.js';
import companyController from '../controllers/companyController.js';

const router = express.Router();

// Aplicar middleware de autenticação em todas as rotas
router.use(authMiddleware);
router.use(tenantMiddleware);

// Rota para obter empresas que o usuário pode acessar
router.get('/accessible', companyController.getAccessibleCompanies);

// Rotas que exigem permissão de admin master
router.use(requireMasterAdmin);

// CRUD de empresas (apenas admin master)
router.get('/', companyController.getAllCompanies);
router.post('/', companyController.createCompany);
router.get('/:id', companyController.getCompanyById);
router.put('/:id', companyController.updateCompany);
router.patch('/:id/toggle-status', companyController.toggleCompanyStatus);
router.delete('/:id', companyController.deleteCompany);

export default router;
