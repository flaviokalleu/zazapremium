import { Op } from 'sequelize';
import { Schedule, Session } from '../models/index.js';
import { processScheduleItem } from '../controllers/scheduleController.js';

let timer = null;
let running = false;

export const startScheduleDispatcher = () => {
  if (timer) return;
  timer = setInterval(tick, 30000); // 30s
  // Run immediately once
  tick().catch(() => {});
};

export const stopScheduleDispatcher = () => {
  if (timer) clearInterval(timer);
  timer = null;
};

async function tick() {
  if (running) return; // prevent overlap
  running = true;
  try {
    // Verificar se a conexão do Sequelize ainda está ativa
    const { sequelize } = await import('../services/sequelize.js');
    if (!sequelize || sequelize.connectionManager._closed) {
      console.log('🔄 ScheduleDispatcher: Conexão com banco fechada, interrompendo processamento');
      return;
    }

    const now = new Date();
    const due = await Schedule.findAll({
      where: {
        status: 'pending',
        sendAt: { [Op.lte]: now }
      },
      include: [{
        model: Session,
        required: true,
        attributes: ['companyId']
      }],
      order: [['sendAt', 'ASC']],
      limit: 10
    });
    for (const item of due) {
      try {
        const session = await Session.findByPk(item.sessionId);
        if (!session) {
          await item.update({ status: 'failed', lastError: 'Sessão não encontrada' });
          continue;
        }
        await processScheduleItem(item, session);
      } catch (err) {
        console.error(`❌ Erro ao processar schedule item ${item.id}:`, err.message);
        // processScheduleItem handles status updates
      }
    }
  } catch (error) {
    if (error.message.includes('ConnectionManager.getConnection was called after')) {
      console.log('🔄 ScheduleDispatcher: Conexão com banco foi fechada durante operação');
      stopScheduleDispatcher();
      return;
    }
    console.error('❌ Erro no ScheduleDispatcher:', error.message);
  } finally {
    running = false;
  }
}
