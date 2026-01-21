import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mentions Légales | Ultron',
  description: 'Mentions légales et informations sur l\'éditeur du site',
};

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm p-8 md:p-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mentions Légales</h1>
        <p className="text-sm text-gray-500 mb-8">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>

        <div className="prose prose-slate max-w-none text-gray-900">
          {/* SECTION 1 */}
          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Informations sur l'Éditeur</h2>

          <h3 className="text-xl font-semibold mt-6 mb-3">Éditeur du site</h3>
          <ul className="list-disc ml-6 space-y-2">
            <li><strong>Raison sociale</strong> : Martin Borgis</li>
            <li><strong>Statut juridique</strong> : Micro-entrepreneur</li>
            <li><strong>SIRET</strong> : 93348899100011</li>
            <li><strong>Code APE/NAF</strong> : 6201Z - Programmation informatique</li>
            <li><strong>Adresse du siège social</strong> : 42 rue Gilbert Cesbron, 75017 Paris, France</li>
            <li><strong>Numéro de téléphone</strong> : Sur demande</li>
            <li><strong>Adresse e-mail</strong> : <a href="mailto:martin.borgis@gmail.com" className="text-indigo-600 hover:underline">martin.borgis@gmail.com</a></li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">Directeur de la publication</h3>
          <p>Martin Borgis, en qualité de responsable éditorial.</p>

          {/* SECTION 2 */}
          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Hébergement</h2>

          <h3 className="text-xl font-semibold mt-6 mb-3">Hébergeur du site</h3>
          <ul className="list-disc ml-6 space-y-2">
            <li><strong>Société</strong> : Vercel Inc.</li>
            <li><strong>Adresse</strong> : 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis</li>
            <li><strong>Site web</strong> : <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">https://vercel.com</a></li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">Base de données</h3>
          <ul className="list-disc ml-6 space-y-2">
            <li><strong>Société</strong> : Supabase Inc.</li>
            <li><strong>Adresse</strong> : 970 Toa Payoh North #07-04, Singapore 318992</li>
            <li><strong>Localisation des serveurs</strong> : Union Européenne (conformité RGPD)</li>
            <li><strong>Site web</strong> : <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">https://supabase.com</a></li>
          </ul>

          {/* SECTION 3 */}
          <h2 className="text-2xl font-semibold mt-8 mb-4">3. Propriété Intellectuelle</h2>

          <h3 className="text-xl font-semibold mt-6 mb-3">Droits d'auteur</h3>
          <p>
            L'ensemble du contenu du présent site web (textes, images, vidéos, logos, icônes, etc.)
            est protégé par les dispositions du Code de la Propriété Intellectuelle et notamment
            par les droits d'auteur. Ces éléments sont la propriété exclusive de Martin Borgis.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-3">Marques</h3>
          <p>
            La marque "Ultron" ainsi que tous les logos et signes distinctifs reproduits sur ce site
            sont la propriété exclusive de Martin Borgis. Toute reproduction ou utilisation de ces
            marques sans autorisation préalable est strictement interdite.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-3">Utilisation</h3>
          <p>
            Toute reproduction, représentation, modification, publication ou adaptation de tout ou
            partie des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite
            sans l'autorisation écrite préalable de Martin Borgis.
          </p>

          {/* SECTION 4 */}
          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Responsabilité et Garanties</h2>

          <h3 className="text-xl font-semibold mt-6 mb-3">Limitation de responsabilité</h3>
          <p>
            L'éditeur s'efforce d'assurer au mieux de ses possibilités l'exactitude et la mise à jour
            des informations diffusées sur ce site. Toutefois, il ne peut garantir l'exactitude,
            la précision ou l'exhaustivité des informations mises à disposition sur ce site.
          </p>

          <p>
            En conséquence, l'éditeur décline toute responsabilité pour :
          </p>
          <ul className="list-disc ml-6 space-y-2">
            <li>Les inexactitudes, erreurs ou omissions portant sur des informations disponibles sur le site</li>
            <li>Les dommages résultant d'une intrusion frauduleuse d'un tiers ayant entraîné une modification des informations</li>
            <li>L'indisponibilité temporaire ou définitive du service</li>
            <li>Les dommages directs ou indirects résultant de l'utilisation du site</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">Disponibilité du service</h3>
          <p>
            L'éditeur s'engage à mettre en œuvre tous les moyens raisonnables à sa disposition pour
            assurer un accès continu au site. Cependant, il se réserve la possibilité d'interrompre
            l'accès au site pour des raisons de maintenance ou pour toute autre raison.
          </p>

          {/* SECTION 5 */}
          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Protection des Données Personnelles</h2>
          <p>
            La collecte et le traitement des données personnelles sur ce site sont régis par notre
            <a href="/privacy" className="text-indigo-600 hover:underline"> Politique de Confidentialité</a>,
            conforme au Règlement Général sur la Protection des Données (RGPD).
          </p>

          <p>
            Pour toute question concernant vos données personnelles, vous pouvez nous contacter à :
            <a href="mailto:martin.borgis@gmail.com" className="text-indigo-600 hover:underline"> martin.borgis@gmail.com</a>
          </p>

          {/* SECTION 6 */}
          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Cookies et Technologies Similaires</h2>
          <p>
            Ce site utilise uniquement des cookies techniques strictement nécessaires au fonctionnement
            de la plateforme (authentification, préférences utilisateur). Nous n'utilisons pas de cookies
            publicitaires ou de tracking.
          </p>

          <p>
            Vous pouvez configurer votre navigateur pour refuser les cookies, mais cela pourrait affecter
            le fonctionnement de certaines parties du site.
          </p>

          {/* SECTION 7 */}
          <h2 className="text-2xl font-semibold mt-8 mb-4">7. Liens Hypertextes</h2>

          <h3 className="text-xl font-semibold mt-6 mb-3">Liens sortants</h3>
          <p>
            Ce site peut contenir des liens vers d'autres sites web. L'éditeur n'est pas responsable
            du contenu de ces sites externes ni des pratiques de ces sites en matière de protection
            des données personnelles.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-3">Liens entrants</h3>
          <p>
            La création de liens hypertextes vers ce site est autorisée sous réserve qu'ils ne soient
            pas réalisés à des fins commerciales ou promotionnelles. Les liens ne doivent en aucun cas
            porter atteinte à l'image de la marque et des services proposés.
          </p>

          {/* SECTION 8 */}
          <h2 className="text-2xl font-semibold mt-8 mb-4">8. Droit Applicable et Juridictions</h2>
          <p>
            Les présentes mentions légales sont régies par le droit français. En cas de différend
            relatif à l'utilisation du site, les tribunaux français seront seuls compétents.
          </p>

          <p>
            Conformément aux dispositions du Code de la consommation concernant le règlement amiable
            des litiges, nous adhérons au service du médiateur CEMAP que vous pouvez contacter :
          </p>
          <ul className="list-disc ml-6 space-y-2">
            <li><strong>Par courrier</strong> : CEMAP - 23 rue Saint-Augustin - 75002 Paris</li>
            <li><strong>En ligne</strong> : <a href="https://www.cemap-mediation.fr" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">https://www.cemap-mediation.fr</a></li>
          </ul>

          {/* SECTION 9 */}
          <h2 className="text-2xl font-semibold mt-8 mb-4">9. Déclarations Réglementaires</h2>

          <h3 className="text-xl font-semibold mt-6 mb-3">CNIL</h3>
          <p>
            Conformément à la loi "Informatique et Libertés" du 6 janvier 1978 modifiée et au RGPD,
            le traitement des données personnelles a fait l'objet d'une analyse d'impact et de la
            mise en place de mesures de protection appropriées.
          </p>

          <h3 className="text-xl font-semibold mt-6 mb-3">TVA</h3>
          <p>
            En qualité de micro-entrepreneur, Martin Borgis bénéficie de la franchise de TVA
            (article 293 B du CGI). TVA non applicable, article 293 B du CGI.
          </p>

          {/* SECTION 10 */}
          <h2 className="text-2xl font-semibold mt-8 mb-4">10. Contact et Réclamations</h2>
          <p>
            Pour toute question concernant ces mentions légales ou le fonctionnement du site,
            vous pouvez nous contacter :
          </p>
          <ul className="list-disc ml-6 space-y-2">
            <li><strong>Email</strong> : <a href="mailto:martin.borgis@gmail.com" className="text-indigo-600 hover:underline">martin.borgis@gmail.com</a></li>
            <li><strong>Courrier</strong> : Martin Borgis - 42 rue Gilbert Cesbron - 75017 Paris</li>
            <li><strong>Délai de réponse</strong> : Nous nous engageons à répondre dans les 48h ouvrées</li>
          </ul>
        </div>

        {/* Liens de navigation */}
        <div className="mt-12 pt-8 border-t flex gap-4">
          <a href="/privacy" className="text-indigo-600 hover:underline">Politique de confidentialité</a>
          <a href="/" className="text-indigo-600 hover:underline">Retour à l'accueil</a>
        </div>
      </div>
    </div>
  );
}