import logging
import json
import requests
import config

logger = logging.getLogger("pcp_producao_agent")

class WhatsAppSender:
    def __init__(self):
        self.api_url = config.WHATSAPP_API_URL
        self.token = config.WHATSAPP_TOKEN
        self.phone = config.WHATSAPP_PHONE
        self.dry_run = config.DRY_RUN

    def format_message(self, data, date_str, report_path):
        """
        Formata a mensagem do WhatsApp conforme especificado.
        """
        fmt_date = "/".join(date_str.split("-")[::-1])
        aderencia = data["aderencia_pct"]
        total_prog = data["total_programado"]
        total_real_enc = data.get("total_realizado_encarregado", 0)
        total_real = data["total_produzido"]
        
        # Formata principais pendências
        pendencias = data["analise"]["produtos_criticos"]
        if pendencias:
            pendencias_str = "\\n".join([f"• {p}" for p in pendencias])
        else:
            pendencias_str = "Nenhuma pendência crítica! 100% de aderência."

        msg = (
            f"*Relatório Diário PCP x Produção - ConcreTrack*\\n"
            f"📅 *Data:* {fmt_date}\\n\\n"
            f"📊 *Resumo Operacional:*\\n"
            f"• Programado (P): *{total_prog}* pçs\\n"
            f"• Realizado (R): *{total_real_enc}* pçs\\n"
            f"• Produzido (Fábrica): *{total_real}* pçs\\n"
            f"• Aderência Geral: *{aderencia:.1f}%*\\n\\n"
            f"⚠️ *Principais Pendências:*\\n"
            f"{pendencias_str}\\n\\n"
            f"🔗 *Link do Relatório:*\\n"
            f"{report_path}"
        )
        return msg

    def send_summary(self, data, date_str, report_path):
        """
        Envia a mensagem para o WhatsApp do usuário ou executa dry-run.
        """
        message = self.format_message(data, date_str, report_path)

        if self.dry_run or not self.api_url:
            logger.info("=== [WHATSAPP SIMULATION (DRY-RUN)] ===")
            logger.info(f"Destinatário: {self.phone or 'Não configurado'}")
            logger.info(f"Mensagem:\\n{message}")
            logger.info("=========================================")
            return True

        # Prepara chamada de API real
        payload = {
            "token": self.token,
            "to": self.phone,
            "body": message
        }
        
        headers = {
            "Content-Type": "application/json"
        }
        
        logger.info(f"Enviando mensagem WhatsApp para {self.phone}...")
        try:
            response = requests.post(self.api_url, headers=headers, data=json.dumps(payload), timeout=15)
            if response.ok:
                logger.info("Mensagem WhatsApp enviada com sucesso!")
                return True
            else:
                logger.error(f"Falha ao enviar WhatsApp: HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            logger.error(f"Erro de conexão ao enviar WhatsApp: {e}")
            return False
