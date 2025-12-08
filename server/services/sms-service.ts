import twilio from 'twilio';
import { log } from '../vite';

// Initialisation du client Twilio avec les variables d'environnement
// Note: Ces variables d'environnement doivent être définies avant d'utiliser ce service
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Interface pour les notifications SMS
export interface SMSNotification {
  phoneNumber: string;
  message: string;
  jobId?: number;
  unitId?: number;
  status?: string;
}

/**
 * Service pour envoyer des SMS aux clients
 */
export class SMSService {
  private client: any | null = null;
  private isConfigured: boolean = false;

  constructor() {
    // Vérifier si les variables d'environnement nécessaires sont définies
    if (accountSid && authToken && twilioPhoneNumber) {
      try {
        this.client = twilio(accountSid, authToken);
        this.isConfigured = true;
        log('Service SMS initialisé avec succès', 'sms');
      } catch (error) {
        log(`Erreur lors de l'initialisation du service SMS: ${error}`, 'sms');
        this.isConfigured = false;
      }
    } else {
      log('Service SMS non configuré. Variables d\'environnement manquantes.', 'sms');
      this.isConfigured = false;
    }
  }

  /**
   * Envoyer un SMS à un client
   * @param notification Données de la notification SMS
   * @returns Promise avec le résultat de l'opération
   */
  async sendSMS(notification: SMSNotification): Promise<any> {
    if (!this.isConfigured) {
      log('Service SMS non configuré. Impossible d\'envoyer le message.', 'sms');
      return { success: false, error: 'Service non configuré' };
    }

    if (!notification.phoneNumber || !notification.message) {
      log('Numéro de téléphone ou message manquant', 'sms');
      return { success: false, error: 'Paramètres invalides' };
    }

    try {
      // Formater le numéro de téléphone au format international (ajouter +1 pour Amérique du Nord)
      const formattedPhoneNumber = this.formatPhoneNumber(notification.phoneNumber);

      // Envoyer le SMS via Twilio
      const message = await this.client.messages.create({
        body: notification.message,
        from: twilioPhoneNumber,
        to: formattedPhoneNumber
      });

      log(`SMS envoyé avec succès: ${message.sid}`, 'sms');
      return { success: true, messageId: message.sid, status: message.status };

    } catch (error: any) {
      log(`Erreur lors de l'envoi du SMS: ${error.message}`, 'sms');
      return { success: false, error: error.message };
    }
  }

  /**
   * Formater un numéro de téléphone selon les normes internationales
   * @param phoneNumber Numéro de téléphone à formater
   * @returns Numéro formaté
   */
  private formatPhoneNumber(phoneNumber: string): string {
    // Enlever les caractères non numériques
    let cleaned = phoneNumber.replace(/\D/g, '');

    // Format pour le Canada (Québec)
    // Si le numéro commence par 1, on le garde, sinon on l'ajoute
    if (!cleaned.startsWith('1') && cleaned.length === 10) {
      cleaned = '1' + cleaned;
    }

    // Ajouter le symbole +
    return '+' + cleaned;
  }

  /**
   * Créer un message de mise à jour de statut pour un travail
   * @param jobId ID du service
   * @param status Nouveau statut
   * @param details Détails supplémentaires
   * @returns Message formaté
   */
  createJobStatusUpdateMessage(jobId: number, status: string, details?: string): string {
    let message = `GestionVR: Le statut de votre service #${jobId} a été mis à jour à "${status}".`;
    
    if (details) {
      message += ` ${details}`;
    }
    
    message += ` Pour plus d'informations, connectez-vous à votre compte ou appelez-nous au 418-833-5777.`;
    
    return message;
  }

  /**
   * Créer un message pour un rappel de rendez-vous
   * @param jobId ID du service
   * @param date Date du rendez-vous
   * @returns Message formaté
   */
  createAppointmentReminderMessage(jobId: number, date: Date): string {
    const formattedDate = date.toLocaleDateString('fr-CA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    return `GestionVR: Rappel de votre rendez-vous pour le service #${jobId} prévu le ${formattedDate}. Si vous devez modifier votre rendez-vous, veuillez nous contacter au 418-833-5777.`;
  }

  /**
   * Vérifier si le service SMS est correctement configuré
   * @returns Booléen indiquant si le service est configuré
   */
  isServiceConfigured(): boolean {
    return this.isConfigured;
  }
}

// Exporter une instance unique du service
export const smsService = new SMSService();