import { a11yCss, EnglishOnlyNote, EnglishText, RecordText, type PlacePack } from "@access-tools/place";
import { findCharging, type ChargingQuery } from "../charging.js";
import { findParking, type ParkingQuery } from "../parking.js";
import { findRepairAndSupply, type RepairQuery } from "../repair.js";
import { findWashrooms, type WashroomQuery } from "../washrooms.js";

function HiddenList({ title, items }: { title: string; items: Array<{ id: string; name: string; reasons: string[] }> }) {
  if (items.length === 0) return null;
  return (
    <section aria-labelledby={`hidden-${title}`}>
      <h3 id={`hidden-${title}`}>{title}</h3>
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            {item.name}: {item.reasons.join(" ")}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function WashroomFinder({ pack, query }: { pack: PlacePack; query: WashroomQuery }) {
  const result = findWashrooms(pack, query);
  const lang = query.lang;
  return (
    <section className="app-ui" aria-labelledby="washroom-heading" lang={lang}>
      <style>{a11yCss}</style>
      <h2 id="washroom-heading">{lang === "fr" ? "Toilettes, tables de change et lève-personnes" : "Washrooms, change tables, and hoists"}</h2>
      <EnglishOnlyNote lang={lang} />
      <p>{result.coverage}</p>
      <p role="status">
        {result.empty
          ? lang === "fr"
            ? "Aucune fiche affichée. Un trou dans ce paquet n'est pas une preuve qu'aucun lieu n'existe."
            : "No record is shown. A gap in this pack is not proof that no place exists."
          : lang === "fr"
            ? `${result.hits.length} fiche(s) affichée(s).`
            : `${result.hits.length} record(s) shown.`}
      </p>
      <ul>
        {result.hits.map((hit) => (
          <li key={hit.washroomId} className="card">
            <h3>
              {hit.placeName} — <RecordText lang={lang} text={hit.washroomName} />
            </h3>
            <p>{hit.recommendation}</p>
            <dl>
              <dt>{lang === "fr" ? "Distance à vol d'oiseau" : "Straight-line distance"}</dt>
              <dd>{hit.distanceMetres === null ? (lang === "fr" ? "Inconnu" : "Unknown") : `${hit.distanceMetres} m`}</dd>
              <dt>{lang === "fr" ? "Transfert" : "Transfer"}</dt>
              <dd>{hit.transferText}</dd>
              <dt>{lang === "fr" ? "Table de change" : "Change table"}</dt>
              <dd>{hit.changeTableText}</dd>
              <dt>{lang === "fr" ? "Lève-personne" : "Hoist"}</dt>
              <dd>{hit.hoistText}</dd>
              <dt>{lang === "fr" ? "Accès" : "Access"}</dt>
              <dd>{hit.accessText}</dd>
              <dt>{lang === "fr" ? "Heures" : "Hours"}</dt>
              <dd>
                <RecordText lang={lang} text={hit.hoursText} />
              </dd>
              <dt>{lang === "fr" ? "Date de vérification" : "Verification date"}</dt>
              <dd>
                {hit.verificationDate}. {hit.tierText}
              </dd>
            </dl>
            {hit.phone ? (
              <p>
                <a href={`tel:${hit.phone}`}>{lang === "fr" ? `Appeler ${hit.phone}` : `Call ${hit.phone}`}</a>
              </p>
            ) : null}
          </li>
        ))}
      </ul>
      {query.showHidden ? (
        <HiddenList
          title={lang === "fr" ? "Fiches cachées" : "Hidden records"}
          items={result.hidden.map((hit) => ({ id: hit.washroomId, name: hit.placeName, reasons: hit.hiddenReasons }))}
        />
      ) : null}
    </section>
  );
}

export function ParkingFinder({ pack, query }: { pack: PlacePack; query: ParkingQuery }) {
  const result = findParking(pack, query);
  const lang = query.lang;
  return (
    <section className="app-ui" aria-labelledby="parking-heading" lang={lang}>
      <style>{a11yCss}</style>
      <h2 id="parking-heading">{lang === "fr" ? "Stationnement accessible" : "Accessible parking"}</h2>
      <EnglishOnlyNote lang={lang} />
      <p role="note">{result.disclaimer}</p>
      <p>
        {lang === "fr"
          ? "Le privilège municipal n'est cité que si la municipalité, le règlement et la date sont tous présents. L'application ne conseille pas sur l'admissibilité au permis."
          : "A municipal privilege is quoted only when the municipality, bylaw, and date are all present. The application does not advise on permit eligibility."}
      </p>
      <ul>
        {result.hits.map((hit) => (
          <li key={hit.bayId} className="card">
            <h3>
              {hit.placeName} — <RecordText lang={lang} text={hit.bayName} />
            </h3>
            <dl>
              <dt>{lang === "fr" ? "Type" : "Type"}</dt>
              <dd>{hit.kindText}</dd>
              <dt>{lang === "fr" ? "Largeur et allée" : "Width and aisle"}</dt>
              <dd>
                {hit.widthText}. {hit.aisleText}
              </dd>
              <dt>{lang === "fr" ? "Distance jusqu'à l'entrée" : "Distance to the entrance"}</dt>
              <dd>{hit.distanceToEntranceText}</dd>
              <dt>{lang === "fr" ? "Paiement" : "Payment"}</dt>
              <dd>
                <RecordText lang={lang} text={hit.paymentText} />
              </dd>
              <dt>{lang === "fr" ? "Date" : "Date"}</dt>
              <dd>
                {hit.verificationDate}. {hit.tierText}
              </dd>
              <dt>{lang === "fr" ? "Hayon" : "Lift"}</dt>
              <dd>{hit.vanLiftText}</dd>
              <dt>{lang === "fr" ? "Privilège" : "Privilege"}</dt>
              <dd>{hit.privilegeText}</dd>
              <dt>{lang === "fr" ? "Hiver" : "Winter"}</dt>
              <dd>{hit.winterText}</dd>
            </dl>
          </li>
        ))}
      </ul>
      {result.empty ? (
        <p role="status">
          {lang === "fr" ? "Aucune place affichée pour ces filtres." : "No bay is shown for these filters."}
        </p>
      ) : null}
      {query.showHidden ? (
        <HiddenList
          title={lang === "fr" ? "Places cachées" : "Hidden bays"}
          items={result.hidden.map((hit) => ({ id: hit.bayId, name: `${hit.placeName} ${hit.bayName}`, reasons: hit.hiddenReasons }))}
        />
      ) : null}
    </section>
  );
}

export function ChargingFinder({ pack, query }: { pack: PlacePack; query: ChargingQuery }) {
  const result = findCharging(pack, query);
  const lang = query.lang;
  return (
    <section className="app-ui" aria-labelledby="charging-heading" lang={lang}>
      <style>{a11yCss}</style>
      <h2 id="charging-heading">{lang === "fr" ? "Recharge des fauteuils et triporteurs" : "Wheelchair and scooter charging"}</h2>
      <EnglishOnlyNote lang={lang} />
      <p>{result.rangeReminder}</p>
      <p>
        {lang === "fr"
          ? "Cet écran ne lit pas la position de l'appareil. La distance utilise le point que vous saisissez."
          : "This screen does not read the device location. Distance uses the point you type."}
      </p>
      <ul>
        {result.hits.map((hit) => (
          <li key={hit.pointId} className="card">
            <h3>
              {hit.placeName} — <RecordText lang={lang} text={hit.pointName} />
            </h3>
            <p>{hit.recommendation}</p>
            <dl>
              <dt>{lang === "fr" ? "Distance à vol d'oiseau" : "Straight-line distance"}</dt>
              <dd>{hit.distanceMetres === null ? (lang === "fr" ? "Inconnu" : "Unknown") : `${hit.distanceMetres} m`}</dd>
              <dt>{lang === "fr" ? "Accès" : "Access"}</dt>
              <dd>{hit.accessText}</dd>
              <dt>{lang === "fr" ? "Heures" : "Hours"}</dt>
              <dd>
                <RecordText lang={lang} text={hit.hoursText} />
              </dd>
              <dt>{lang === "fr" ? "Siège" : "Seating"}</dt>
              <dd>{hit.seatingText}</dd>
              <dt>{lang === "fr" ? "Date" : "Date"}</dt>
              <dd>
                {hit.verificationDate}. {hit.tierText}
              </dd>
            </dl>
            {hit.rangeText ? <p>{hit.rangeText}</p> : null}
            {hit.phone ? (
              <p>
                <a href={`tel:${hit.phone}`}>{lang === "fr" ? `Appeler ${hit.phone}` : `Call ${hit.phone}`}</a>
              </p>
            ) : null}
          </li>
        ))}
      </ul>
      {result.empty ? (
        <p role="status">{lang === "fr" ? "Aucun point de recharge affiché." : "No charging point is shown."}</p>
      ) : null}
    </section>
  );
}

export function RepairSupplyFinder({ pack, query }: { pack: PlacePack; query: RepairQuery }) {
  const result = findRepairAndSupply(pack, query);
  const lang = query.lang;
  return (
    <section className="app-ui" aria-labelledby="repair-heading" lang={lang}>
      <style>{a11yCss}</style>
      <h2 id="repair-heading">{lang === "fr" ? "Réparation et fournitures" : "Repair and supply"}</h2>
      <EnglishOnlyNote lang={lang} />
      <p role="note">{result.disclaimer}</p>
      <p>{result.stockNote}</p>
      <ul>
        {result.hits.map((hit) => (
          <li key={hit.id} className="card">
            <h3>{hit.name}</h3>
            <dl>
              <dt>{lang === "fr" ? "Distance à vol d'oiseau" : "Straight-line distance"}</dt>
              <dd>{hit.distanceMetres === null ? (lang === "fr" ? "Inconnu" : "Unknown") : `${hit.distanceMetres} m`}</dd>
              <dt>{hit.kind === "repair" ? (lang === "fr" ? "Services publiés" : "Published services") : lang === "fr" ? "Catégories publiées" : "Published categories"}</dt>
              <dd>{hit.servicesText}</dd>
              <dt>{lang === "fr" ? "Heures" : "Hours"}</dt>
              <dd>
                <RecordText lang={lang} text={hit.hoursText} />
              </dd>
              <dt>{lang === "fr" ? "Détail" : "Detail"}</dt>
              <dd>
                <EnglishText lang={lang} text={hit.extraText} fragments={hit.englishFragments} />
              </dd>
              <dt>{lang === "fr" ? "Date" : "Date"}</dt>
              <dd>
                {hit.verificationDate}. {hit.tierText}
              </dd>
            </dl>
            {hit.phone ? (
              <p>
                <a href={`tel:${hit.phone}`}>{lang === "fr" ? `Appeler ${hit.phone}` : `Call ${hit.phone}`}</a>
              </p>
            ) : (
              <p>{lang === "fr" ? "Téléphone : Inconnu" : "Phone: Unknown"}</p>
            )}
            {hit.website ? (
              <p>
                <a href={hit.website}>{lang === "fr" ? "Page du jeu d'essai" : "Fixture page"}</a>
              </p>
            ) : null}
          </li>
        ))}
      </ul>
      {result.empty ? (
        <p role="status">{lang === "fr" ? "Aucune fiche affichée." : "No record is shown."}</p>
      ) : null}
      {query.showHidden ? (
        <HiddenList
          title={lang === "fr" ? "Fiches cachées" : "Hidden records"}
          items={result.hidden.map((hit) => ({ id: hit.id, name: hit.name, reasons: hit.hiddenReasons }))}
        />
      ) : null}
    </section>
  );
}
