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
            f"• Programado: *{total_prog}* pçs\\n"
            f"• Produzido: *{total_real}* pçs\\n"
            f"• Aderência: *{aderencia:.1f}%*\\n\\n"
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
            logger.info(f"Mensagem:\\n{message.replace('\\n', '\n')}")
            logger.info("=========================================")
            return True

        # Se houver API do WhatsApp configurada (ex: Evolution API ou Webhook próprio)
        headers = {
            "Content-Type": "application/json"
        }
        if self.token:
            headers["apikey"] = self.token
            headers["Authorization"] = f"Bearer {self.token}"

        # Payload genérico (adaptável para Evolution API, z-api ou webhook customizado)
        payload = {
            "number": self.phone,
            "message": message.replace("\\n", "\n"),
            "text": message.replace("\\n", "\n")
        }

        logger.info(f"Enviando resumo por WhatsApp para {self.phone}...")
        try:
            # Envia a requisição
            response = requests.post(self.api_url, headers=headers, json=payload, timeout=10)
            if response.ok:
                logger.info("WhatsApp enviado com sucesso!")
                return True
            else:
                logger.error(f"Erro ao enviar WhatsApp: HTTP {response.status_code} - {response.text}")
                return False
        except Exception as e:
            logger.error(f"Falha de rede ao tentar enviar WhatsApp: {e}")
            return False
