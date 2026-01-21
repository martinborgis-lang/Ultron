import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Politique de Confidentialité | Ultron',
  description: 'Politique de confidentialité et protection des données personnelles',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm p-8 md:p-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Politique de Confidentialité</h1>
        <p className="text-sm text-gray-500 mb-8">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>

        <div className="prose prose-slate max-w-none text-gray-900">
          {/* SECTION 1 */}
          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Introduction</h2>
          <p>
            La présente politique de confidentialité décrit comment <strong>Martin Borgis</strong>
            (ci-après "nous", "notre" ou "Ultron") collecte, utilise, stocke et protège vos données
            personnelles dans le cadre de l'utilisation de notre plateforme de gestion de la relation
            client (CRM) accessible à l'adresse <a href="https://ultron-murex.vercel.app" className="text-indigo-600 hover:underline">https://ultron-murex.vercel.app</a>.
          </p>
          <p>
            Nous nous engageons à respecter votre vie privée et à protéger vos données personnelles
            conformément au Règlement Général sur la Protection des Données (RGPD - Règlement UE 2016/679)
            et à la loi Informatique et Libertés.
          </p>

          {/* SECTION 2 */}
          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Identité du Responsable de Traitement</h2>
          <ul className="list-disc ml-6 space-y-2">
            <li><strong>Nom</strong> : Martin Borgis</li>
            <li><strong>Statut</strong> : Micro-entrepreneur</li>
            <li><strong>SIRET</strong> : 93348899100011</li>
            <li><strong>Adresse</strong> : 42 rue Gilbert Cesbron, 75017 Paris, France</li>
            <li><strong>Email</strong> : martin.borgis@gmail.com</li>
          </ul>
          <p>
            Pour toute question relative à la protection de vos données personnelles, vous pouvez
            nous contacter à l'adresse : <a href="mailto:martin.borgis@gmail.com" className="text-indigo-600 hover:underline">martin.borgis@gmail.com</a>
          </p>

          {/* SECTION 3 */}
          <h2 className="text-2xl font-semibold mt-8 mb-4">3. Données Personnelles Collectées</h2>

          <h3 className="text-xl font-semibold mt-6 mb-3">3.1 Données des utilisateurs de la Plateforme</h3>
          <ul className="list-disc ml-6 space-y-2">
            <li><strong>Identité</strong> : nom, prénom, email professionnel</li>
            <li><strong>Authentification</strong> : mot de passe (hashé), tokens de session</li>
            <li><strong>Données professionnelles</strong> : rôle, organisation</li>
            <li><strong>Données techniques</strong> : adresse IP, logs de connexion</li>
            <li><strong>Intégrations</strong> : tokens OAuth Google (Gmail, Sheets, Calendar)</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">3.2 Données des prospects</h3>
          <ul className="list-disc ml-6 space-y-2">
            <li><strong>Identité</strong> : nom, prénom, email, téléphone</li>
            <li><strong>Données financières</strong> : patrimoine estimé, revenus annuels</li>
            <li><strong>Données professionnelles</strong> : profession, situation professionnelle</li>
            <li><strong>Données familiales</strong> : situation familiale, nombre d'enfants, âge</li>
            <li><strong>Données de suivi</strong> : historique des échanges, notes, RDV</li>
            <li><strong>Données de qualification</strong> : score IA, qualification, analyse</li>
          </ul>

          {/* SECTION 4 */}
          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Finalités et Bases Légales</h2>
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-300 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="border border-gray-300 px-4 py-2 text-left">Finalité</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Base légale</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Durée de conservation</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">Gestion des comptes utilisateurs</td>
                  <td className="border border-gray-300 px-4 py-2">Exécution du contrat</td>
                  <td className="border border-gray-300 px-4 py-2">Durée du contrat + 3 ans</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">Gestion des prospects</td>
                  <td className="border border-gray-300 px-4 py-2">Intérêt légitime</td>
                  <td className="border border-gray-300 px-4 py-2">3 ans après le dernier contact</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">Qualification automatique par IA</td>
                  <td className="border border-gray-300 px-4 py-2">Intérêt légitime + Consentement</td>
                  <td className="border border-gray-300 px-4 py-2">3 ans après le dernier contact</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">Envoi d'emails commerciaux</td>
                  <td className="border border-gray-300 px-4 py-2">Consentement explicite</td>
                  <td className="border border-gray-300 px-4 py-2">Jusqu'au retrait du consentement</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">Sécurité et logs</td>
                  <td className="border border-gray-300 px-4 py-2">Intérêt légitime</td>
                  <td className="border border-gray-300 px-4 py-2">1 an</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* SECTION 5 */}
          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Destinataires des Données</h2>

          <h3 className="text-xl font-semibold mt-6 mb-3">5.1 Destinataires internes</h3>
          <ul className="list-disc ml-6 space-y-2">
            <li>Les conseillers de l'organisation qui gère votre dossier</li>
            <li>Les administrateurs de l'organisation</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">5.2 Sous-traitants techniques</h3>
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-300 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="border border-gray-300 px-4 py-2 text-left">Sous-traitant</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Fonction</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Localisation</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">Supabase</td>
                  <td className="border border-gray-300 px-4 py-2">Hébergement base de données</td>
                  <td className="border border-gray-300 px-4 py-2">Union Européenne</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">Vercel</td>
                  <td className="border border-gray-300 px-4 py-2">Hébergement application</td>
                  <td className="border border-gray-300 px-4 py-2">États-Unis (SCC)</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">Google</td>
                  <td className="border border-gray-300 px-4 py-2">Gmail, Sheets, Calendar</td>
                  <td className="border border-gray-300 px-4 py-2">États-Unis (SCC)</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">Anthropic</td>
                  <td className="border border-gray-300 px-4 py-2">Intelligence Artificielle</td>
                  <td className="border border-gray-300 px-4 py-2">États-Unis (SCC)</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">Upstash</td>
                  <td className="border border-gray-300 px-4 py-2">Programmation de tâches</td>
                  <td className="border border-gray-300 px-4 py-2">États-Unis (SCC)</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-sm text-gray-600 mt-2">SCC = Clauses Contractuelles Types approuvées par la Commission Européenne</p>

          {/* SECTION 6 */}
          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Transferts Hors Union Européenne</h2>
          <p>
            Certains de nos sous-traitants sont situés aux États-Unis. Ces transferts sont encadrés
            par des Clauses Contractuelles Types (SCC) approuvées par la Commission Européenne.
          </p>
          <p>
            <strong>Cas particulier de l'Intelligence Artificielle :</strong> Pour la qualification
            automatique des prospects, certaines données professionnelles et financières peuvent être
            transmises à Anthropic (États-Unis). Vous pouvez vous opposer à ce traitement en nous
            contactant.
          </p>

          {/* SECTION 7 */}
          <h2 className="text-2xl font-semibold mt-8 mb-4">7. Vos Droits</h2>
          <p>Conformément au RGPD, vous disposez des droits suivants :</p>
          <ul className="list-disc ml-6 space-y-2">
            <li><strong>Droit d'accès</strong> (Article 15) : obtenir une copie de vos données</li>
            <li><strong>Droit de rectification</strong> (Article 16) : corriger des données inexactes</li>
            <li><strong>Droit d'effacement</strong> (Article 17) : demander la suppression de vos données</li>
            <li><strong>Droit à la limitation</strong> (Article 18) : limiter le traitement de vos données</li>
            <li><strong>Droit à la portabilité</strong> (Article 20) : recevoir vos données en format structuré</li>
            <li><strong>Droit d'opposition</strong> (Article 21) : vous opposer au traitement</li>
            <li><strong>Droit de retirer votre consentement</strong> à tout moment</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">Comment exercer vos droits</h3>
          <p>
            <strong>Par email :</strong> <a href="mailto:martin.borgis@gmail.com" className="text-indigo-600 hover:underline">martin.borgis@gmail.com</a>
          </p>
          <p>
            <strong>Par courrier :</strong><br />
            Martin Borgis<br />
            42 rue Gilbert Cesbron<br />
            75017 Paris, France
          </p>
          <p>
            Nous répondrons à votre demande dans un délai d'<strong>un mois</strong> maximum.
          </p>

          {/* SECTION 8 */}
          <h2 className="text-2xl font-semibold mt-8 mb-4">8. Sécurité des Données</h2>
          <p>Nous mettons en œuvre des mesures techniques et organisationnelles appropriées :</p>
          <ul className="list-disc ml-6 space-y-2">
            <li>Chiffrement des communications (HTTPS/TLS)</li>
            <li>Authentification forte des utilisateurs</li>
            <li>Isolation des données par organisation (multi-tenant)</li>
            <li>Sauvegardes régulières</li>
            <li>Accès limité selon le principe du "besoin d'en connaître"</li>
          </ul>

          {/* SECTION 9 */}
          <h2 className="text-2xl font-semibold mt-8 mb-4">9. Durées de Conservation</h2>
          <ul className="list-disc ml-6 space-y-2">
            <li><strong>Prospects actifs</strong> : durée de la relation commerciale</li>
            <li><strong>Prospects inactifs</strong> : 3 ans après le dernier contact</li>
            <li><strong>Données de facturation</strong> : 10 ans (obligations comptables)</li>
            <li><strong>Logs techniques</strong> : 1 an</li>
          </ul>

          {/* SECTION 10 */}
          <h2 className="text-2xl font-semibold mt-8 mb-4">10. Cookies</h2>
          <p>
            Notre plateforme utilise uniquement des cookies techniques strictement nécessaires
            au fonctionnement (authentification, préférences). Nous n'utilisons pas de cookies
            publicitaires ou de tracking.
          </p>

          {/* SECTION 11 */}
          <h2 className="text-2xl font-semibold mt-8 mb-4">11. Modifications</h2>
          <p>
            Nous pouvons modifier cette politique à tout moment. En cas de modification substantielle,
            nous vous en informerons par email ou notification sur la plateforme.
          </p>

          {/* SECTION 12 */}
          <h2 className="text-2xl font-semibold mt-8 mb-4">12. Réclamations</h2>
          <p>
            Si vous estimez que le traitement de vos données n'est pas conforme, vous pouvez :
          </p>
          <ol className="list-decimal ml-6 space-y-2">
            <li>Nous contacter : <a href="mailto:martin.borgis@gmail.com" className="text-indigo-600 hover:underline">martin.borgis@gmail.com</a></li>
            <li>Saisir la CNIL : <a href="https://www.cnil.fr/fr/plaintes" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">www.cnil.fr/plaintes</a></li>
          </ol>

          {/* SECTION 13 */}
          <h2 className="text-2xl font-semibold mt-8 mb-4">13. Contact</h2>
          <p>
            Pour toute question concernant cette politique ou vos données personnelles :
          </p>
          <p>
            <strong>Email :</strong> <a href="mailto:martin.borgis@gmail.com" className="text-indigo-600 hover:underline">martin.borgis@gmail.com</a><br />
            <strong>Adresse :</strong> Martin Borgis, 42 rue Gilbert Cesbron, 75017 Paris, France
          </p>
        </div>

        {/* Liens de navigation */}
        <div className="mt-12 pt-8 border-t flex gap-4">
          <a href="/legal" className="text-indigo-600 hover:underline">Mentions légales</a>
          <a href="/" className="text-indigo-600 hover:underline">Retour à l'accueil</a>
        </div>
      </div>
    </div>
  );
}