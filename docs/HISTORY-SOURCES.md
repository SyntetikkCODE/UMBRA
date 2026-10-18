# Origine de l’historique UMBRA

Les notes destinées aux joueurs sont maintenues dans `src/release-notes.mjs`. Elles génèrent `CHANGELOG.md`, la page statique `site/patchnotes/index.html` et sa feuille de style, et sont embarquées directement dans l’application.

Reconstitution du 18 octobre 2026 :

- Prototypes 0.1 à 0.3.1 : besoins et changements consignés pendant le développement, références aux formats 0.1 et 0.2, README et sources du paquet Windows 0.3.1 conservé. Le détail exact de chaque sous-version n’a pas été conservé : ce bloc est explicitement regroupé, sans dates inventées.
- 0.4.0 et 0.5.0 : README et instructions présents dans les anciens paquets Windows conservés.
- 0.6.0 à 0.14.2 : instructions d’installation, sections de version du README de développement, archives de sources et installeurs versionnés conservés. Ces sources privées ne sont pas recopiées dans le journal public : seuls les changements fonctionnels sont résumés.
- 0.15.0 : commit `e652b25` et `docs/VALIDATION-0.15.0.md`.
- 0.15.1 : commit `8e6b76d` et `docs/VALIDATION-0.15.1.md`.
- 0.15.2 : commit `4e5edae` et `docs/VALIDATION-0.15.2.md`.
- 0.15.3 : commit `0211198` et `docs/VALIDATION-0.15.3.md`.
- 0.15.4 : commit `f743fb7` et `docs/VALIDATION-0.15.4.md`.
- 0.15.5 : ajout des trois présentations de cet historique et `docs/VALIDATION-0.15.5.md`.

Les dates affichées pour les versions récentes sont celles confirmées par les publications et les commits. Les dates anciennes incertaines ne sont pas affichées. Les entrées historiques décrivent le comportement de leur version ; un changement ultérieur peut le remplacer.

Pour une nouvelle version : ajouter son entrée en tête, modifier la version du paquet, lancer `npm run build:notes`, vérifier `npm run check:notes`, puis publier les sources et copier `site/patchnotes/index.html` et `site/patchnotes.css` vers la page de téléchargement. Le build refuse une version de paquet sans notes correspondantes. Les notes restent lisibles dans l’app sans requête réseau.
