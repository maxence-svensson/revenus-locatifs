import { defineStore } from 'pinia'
import {
  dossierExemple,
  dossierSchema,
  dossierVide,
  type Dossier,
  type Travaux,
} from '#shared/model/dossier'
import { projeter, type Projection } from '#shared/projection/projection'
import { effacerDossier, enregistrerDossier, lireDossier } from '~/utils/storage'

/** Le brouillon accepte des champs vides pendant la saisie ; le dossier validé n'en a pas. */
type Brouillon = Dossier

export const useDossierStore = defineStore('dossier', () => {
  const anneeCourante = new Date().getFullYear()
  const brouillon = ref<Brouillon>(dossierVide(anneeCourante))
  const demo = ref(false)
  const charge = ref(false)
  const touche = ref(false)

  const validation = computed(() => dossierSchema.safeParse(brouillon.value))
  const dossier = computed<Dossier>(() =>
    validation.value.success ? validation.value.data : dossierVide(anneeCourante),
  )
  const erreurs = computed(() =>
    validation.value.success
      ? []
      : validation.value.error.issues.map((i) => `${i.path.join('.')} : ${i.message}`),
  )

  const projection = computed<Projection>(() => projeter(dossier.value))

  /** Le dossier contient-il de quoi calculer quelque chose ? */
  const renseigne = computed(() => dossier.value.bien.loyerMensuelHorsCharges > 0)

  function charger() {
    if (charge.value) return
    const sauve = lireDossier()
    if (sauve) {
      brouillon.value = sauve.dossier
      demo.value = sauve.demo
      touche.value = true
    }
    charge.value = true
  }

  function chargerExemple() {
    brouillon.value = dossierExemple(anneeCourante)
    demo.value = true
    touche.value = true
    enregistrerDossier({ demo: true, dossier: brouillon.value })
  }

  function reinitialiser() {
    brouillon.value = dossierVide(anneeCourante)
    demo.value = false
    touche.value = false
    effacerDossier()
  }

  function ajouterTravaux() {
    const t: Travaux = {
      id: `t-${Date.now().toString(36)}`,
      annee: brouillon.value.bien.anneeMiseEnLocation,
      montant: 0,
      nature: 'entretien',
      libelle: '',
    }
    brouillon.value.bien.travaux.push(t)
  }

  function supprimerTravaux(id: string) {
    brouillon.value.bien.travaux = brouillon.value.bien.travaux.filter((t) => t.id !== id)
  }

  watch(
    brouillon,
    () => {
      if (!charge.value) return
      touche.value = true
      // L'exemple cesse d'en être un dès qu'il est modifié.
      if (
        demo.value &&
        JSON.stringify(brouillon.value) !== JSON.stringify(dossierExemple(anneeCourante))
      )
        demo.value = false
      if (validation.value.success)
        enregistrerDossier({ demo: demo.value, dossier: validation.value.data })
    },
    { deep: true },
  )

  return {
    brouillon,
    dossier,
    erreurs,
    projection,
    demo,
    touche,
    renseigne,
    charger,
    chargerExemple,
    reinitialiser,
    ajouterTravaux,
    supprimerTravaux,
  }
})
