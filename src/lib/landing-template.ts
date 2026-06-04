// Plantilla de landing de presentación (HTML autónomo, muy visual).
// Se carga con un clic en /admin/landings y se puede editar libremente.
// Editable: número de WhatsApp, logos del carrusel, textos.

export const DEFAULT_LANDING_HTML = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Konecta3D — Convierte cada feria en clientes</title>
<meta name="description" content="El sistema que captura los contactos que hoy pierdes en cada feria. Un llavero con tu marca + una plataforma que trabaja por ti." />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
<style>
  :root{
    --bg:#07201e; --bg2:#0a3a36;
    --gold:#C5A059; --gold-bright:#E5C07B;
    --white:#F4F1EA; --muted:#9fb0ac; --muted2:#7d908c;
    --card:rgba(255,255,255,0.045); --border:rgba(255,255,255,0.10);
    --radius:20px;
  }
  *{margin:0;padding:0;box-sizing:border-box}
  html{scroll-behavior:smooth}
  body{
    font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;
    background:var(--bg); color:var(--white); line-height:1.6;
    overflow-x:hidden; -webkit-font-smoothing:antialiased;
  }
  .wrap{max-width:1080px;margin:0 auto;padding:0 24px}
  a{color:inherit;text-decoration:none}
  /* fondo con glows */
  .bgfx{position:fixed;inset:0;z-index:-1;background:
    radial-gradient(60% 50% at 80% 0%, rgba(197,160,89,0.16), transparent 60%),
    radial-gradient(50% 40% at 10% 20%, rgba(45,122,116,0.35), transparent 60%),
    linear-gradient(160deg, var(--bg) 0%, var(--bg2) 55%, var(--bg) 100%);}

  /* header */
  header{position:sticky;top:0;z-index:50;backdrop-filter:blur(12px);
    background:rgba(7,32,30,0.6);border-bottom:1px solid var(--border)}
  .nav{display:flex;align-items:center;justify-content:space-between;height:68px}
  .logo{display:flex;align-items:center;gap:10px;font-weight:800;letter-spacing:.02em}
  .logo .mark{width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,var(--gold-bright),var(--gold));
    color:#0a2422;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:18px}
  .btn{display:inline-flex;align-items:center;gap:8px;font-weight:700;border-radius:999px;
    padding:12px 22px;font-size:15px;transition:transform .15s ease, box-shadow .2s ease;cursor:pointer;border:none}
  .btn-gold{background:linear-gradient(135deg,var(--gold-bright),var(--gold));color:#0a2422;
    box-shadow:0 8px 30px rgba(197,160,89,0.35)}
  .btn-gold:hover{transform:translateY(-2px);box-shadow:0 12px 40px rgba(197,160,89,0.5)}
  .btn-ghost{background:transparent;color:var(--white);border:1px solid var(--border)}
  .btn-ghost:hover{background:rgba(255,255,255,0.06)}
  .btn-sm{padding:9px 18px;font-size:14px}

  /* hero */
  .hero{padding:90px 0 70px;text-align:center}
  .badge{display:inline-flex;align-items:center;gap:8px;font-size:13px;font-weight:600;color:var(--gold-bright);
    background:rgba(197,160,89,0.12);border:1px solid rgba(197,160,89,0.3);padding:7px 16px;border-radius:999px;margin-bottom:28px}
  .dot{width:7px;height:7px;border-radius:50%;background:var(--gold-bright);box-shadow:0 0 10px var(--gold-bright)}
  h1{font-size:clamp(34px,6vw,62px);font-weight:900;line-height:1.05;letter-spacing:-0.02em;margin-bottom:22px}
  h1 .accent{background:linear-gradient(135deg,var(--gold-bright),var(--gold));-webkit-background-clip:text;background-clip:text;color:transparent}
  .lead{font-size:clamp(17px,2.5vw,21px);color:var(--muted);max-width:680px;margin:0 auto 36px}
  .cta-row{display:flex;gap:14px;justify-content:center;flex-wrap:wrap}
  .micro{margin-top:18px;font-size:13px;color:var(--muted2)}

  /* secciones */
  section{padding:70px 0}
  .eyebrow{font-size:13px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--gold);margin-bottom:14px}
  h2{font-size:clamp(26px,4vw,40px);font-weight:800;line-height:1.15;letter-spacing:-0.01em;margin-bottom:18px}
  .section-lead{font-size:17px;color:var(--muted);max-width:620px}
  .center{text-align:center;margin-left:auto;margin-right:auto}

  /* tarjetas problema */
  .grid{display:grid;gap:18px}
  .g3{grid-template-columns:repeat(3,1fr)}
  .g2{grid-template-columns:repeat(2,1fr)}
  .card{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:26px}
  .card h3{font-size:18px;font-weight:700;margin-bottom:8px}
  .card p{font-size:15px;color:var(--muted)}
  .pain h3{color:#f3a8a8}
  .ico{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;
    font-size:22px;margin-bottom:16px;background:rgba(197,160,89,0.12);border:1px solid rgba(197,160,89,0.25)}

  /* cómo funciona */
  .steps{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;counter-reset:s}
  .step{position:relative;background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:30px 26px}
  .step::before{counter-increment:s;content:counter(s);position:absolute;top:-18px;left:26px;
    width:42px;height:42px;border-radius:12px;background:linear-gradient(135deg,var(--gold-bright),var(--gold));
    color:#0a2422;font-weight:900;font-size:20px;display:flex;align-items:center;justify-content:center;
    box-shadow:0 8px 24px rgba(197,160,89,0.4)}
  .step h3{margin-top:14px;font-size:19px;font-weight:700;margin-bottom:8px}
  .step p{color:var(--muted);font-size:15px}

  /* posibilidad destacada */
  .highlight{background:linear-gradient(135deg,rgba(197,160,89,0.10),rgba(45,122,116,0.10));
    border:1px solid rgba(197,160,89,0.22);border-radius:28px;padding:50px 40px;text-align:center}

  /* marquee logos */
  .marquee{overflow:hidden;-webkit-mask-image:linear-gradient(to right,transparent,#000 8%,#000 92%,transparent);
    mask-image:linear-gradient(to right,transparent,#000 8%,#000 92%,transparent)}
  .mtrack{display:flex;width:max-content;gap:18px;animation:scroll 40s linear infinite}
  .marquee:hover .mtrack{animation-play-state:paused}
  @keyframes scroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
  .logo-chip{flex:0 0 auto;height:64px;min-width:150px;display:flex;align-items:center;justify-content:center;
    padding:0 26px;background:rgba(255,255,255,0.05);border:1px solid var(--border);border-radius:14px;
    color:var(--muted);font-weight:700;letter-spacing:.04em;font-size:14px}
  .logo-chip img{max-height:38px;max-width:120px;object-fit:contain;filter:grayscale(1) brightness(1.6);opacity:.85}

  /* faq */
  .faq{max-width:760px;margin:0 auto}
  .q{background:var(--card);border:1px solid var(--border);border-radius:16px;margin-bottom:12px;overflow:hidden}
  .q summary{list-style:none;cursor:pointer;padding:20px 24px;font-weight:700;font-size:16px;display:flex;
    align-items:center;justify-content:space-between;gap:16px}
  .q summary::-webkit-details-marker{display:none}
  .q summary::after{content:"+";font-size:24px;color:var(--gold-bright);transition:transform .2s}
  .q[open] summary::after{transform:rotate(45deg)}
  .q .a{padding:0 24px 20px;color:var(--muted);font-size:15px}

  /* cta final */
  .final{background:linear-gradient(135deg,rgba(197,160,89,0.14),rgba(45,122,116,0.12));
    border:1px solid rgba(197,160,89,0.25);border-radius:32px;padding:60px 40px;text-align:center}

  footer{padding:40px 0 60px;border-top:1px solid var(--border);color:var(--muted2);font-size:14px;text-align:center}
  footer .logo{justify-content:center;margin-bottom:14px;color:var(--white)}

  /* reveal */
  [data-reveal]{opacity:0;transform:translateY(24px);transition:opacity .7s ease,transform .7s ease}
  [data-reveal].in{opacity:1;transform:none}

  @media(max-width:860px){.g3,.g2,.steps{grid-template-columns:1fr}.nav .btn-sm{padding:8px 14px}}
</style>
</head>
<body>
<div class="bgfx"></div>

<!-- ░░ HEADER ░░ -->
<header>
  <div class="wrap nav">
    <div class="logo"><span class="mark">K</span> Konecta3D</div>
    <!-- EDITA EL NÚMERO DE WHATSAPP (formato internacional sin +) -->
    <a class="btn btn-gold btn-sm" href="https://wa.me/34623759451?text=Hola%2C%20quiero%20info%20de%20Konecta3D%20para%20mi%20pr%C3%B3xima%20feria">Hablar por WhatsApp</a>
  </div>
</header>

<!-- ░░ HERO ░░ -->
<section class="hero">
  <div class="wrap">
    <div class="badge" data-reveal><span class="dot"></span> Para negocios que captan clientes en ferias y eventos</div>
    <h1 data-reveal>Cada feria te cuesta miles.<br/><span class="accent">¿Cuántos clientes se van sin dejar rastro?</span></h1>
    <p class="lead" data-reveal>Konecta3D es el sistema que captura los contactos que hoy pierdes en cada evento: un llavero con tu marca que tus visitantes tocan con el móvil y quedan guardados en tu plataforma. Tú llegas el lunes con los leads listos.</p>
    <div class="cta-row" data-reveal>
      <a class="btn btn-gold" href="https://wa.me/34623759451?text=Hola%2C%20quiero%20info%20de%20Konecta3D">Quiero verlo para mi negocio</a>
      <a class="btn btn-ghost" href="#como">Ver cómo funciona</a>
    </div>
    <p class="micro" data-reveal>Pruébalo gratis un mes · Sin permanencia · Listo para tu próxima feria</p>
  </div>
</section>

<!-- ░░ PROBLEMA ░░ -->
<section>
  <div class="wrap">
    <div class="eyebrow" data-reveal>El problema</div>
    <h2 data-reveal>Inviertes en presencia, pero no en permanencia</h2>
    <p class="section-lead" data-reveal style="margin-bottom:38px">Montas el stand, llevas al equipo, gastas en material. Tres días agotadores. Y el domingo todo se apaga. Esto es lo que pasa de verdad:</p>
    <div class="grid g3">
      <div class="card pain" data-reveal><div class="ico">📇</div><h3>Vuelves con tarjetas</h3><p>Un puñado de papeles que no sabes si servirán. La mayoría de los interesados pasó, miró y se fue sin que quede rastro.</p></div>
      <div class="card pain" data-reveal><div class="ico">⏳</div><h3>El interés se enfría</h3><p>Cuando por fin haces el seguimiento, ya pasaron días. El momento en que tu cliente estaba caliente se perdió.</p></div>
      <div class="card pain" data-reveal><div class="ico">❓</div><h3>No sabes qué funcionó</h3><p>No tienes números por feria. Inviertes igual en todas sin saber cuál te trajo clientes y cuál fue dinero tirado.</p></div>
    </div>
    <p class="section-lead center" data-reveal style="margin-top:38px;font-size:19px;color:var(--white)">El coste real no es el stand. Es <strong>todo el negocio que se quedó en la feria y no volvió contigo</strong>.</p>
  </div>
</section>

<!-- ░░ POSIBILIDAD ░░ -->
<section>
  <div class="wrap">
    <div class="highlight" data-reveal>
      <div class="eyebrow center">Imagina lo contrario</div>
      <h2>Llegas el lunes con la lista ya hecha</h2>
      <p class="section-lead center" style="font-size:18px">Sabes quién pasó por tu stand y qué le interesó. Tu equipo escribe a gente que ya mostró interés, no llama en frío. Eres el stand del que todos preguntan. Y al cerrar la feria, abres un panel y ves, en números, cuántos leads te dio y si vale la pena repetir.</p>
    </div>
  </div>
</section>

<!-- ░░ CÓMO FUNCIONA (PUENTE) ░░ -->
<section id="como">
  <div class="wrap">
    <div class="eyebrow center" data-reveal>Cómo funciona</div>
    <h2 class="center" data-reveal>El puente entre esas dos realidades</h2>
    <p class="section-lead center" data-reveal style="margin-bottom:50px">Un objeto físico con tu marca + una plataforma que trabaja por ti.</p>
    <div class="steps">
      <div class="step" data-reveal><h3>Tu visitante toca el llavero</h3><p>Acerca el móvil al llavero con tu marca y, en un segundo, se abre tu página. Sin apps, sin fricción.</p></div>
      <div class="step" data-reveal><h3>Queda capturado al instante</h3><p>Su contacto y lo que le interesó entran en tu plataforma automáticamente, aunque tu equipo esté ocupado.</p></div>
      <div class="step" data-reveal><h3>Tu marca se queda con él</h3><p>El llavero se lo lleva a casa y lo usa a diario. Sigues presente cuando ya olvidó los demás stands.</p></div>
    </div>
  </div>
</section>

<!-- ░░ BENEFICIOS POR DESEO ░░ -->
<section>
  <div class="wrap">
    <div class="eyebrow" data-reveal>Lo que cambia para ti</div>
    <h2 data-reveal>Un sistema, no una herramienta más</h2>
    <div class="grid g2" style="margin-top:38px">
      <div class="card" data-reveal><div class="ico">🌅</div><h3>El lunes, con los leads listos</h3><p>Sin haber hecho nada diferente en la feria. Los contactos están esperándote, no los estás buscando.</p></div>
      <div class="card" data-reveal><div class="ico">✨</div><h3>El stand más avanzado del evento</h3><p>Dejas de dar tarjetas de papel. Eres del que todos preguntan "¿qué es ese llavero?".</p></div>
      <div class="card" data-reveal><div class="ico">📊</div><h3>Justificas cada euro</h3><p>Por fin sabes qué feria fue rentable. Decides dónde repetir con datos, no con intuición.</p></div>
      <div class="card" data-reveal><div class="ico">🤝</div><h3>Tu equipo cierra más</h3><p>Menos llamadas en frío. Hablan con gente que ya mostró interés y llega informada.</p></div>
    </div>
  </div>
</section>

<!-- ░░ LOGOS ░░ -->
<section>
  <div class="wrap">
    <p class="eyebrow center" data-reveal>Negocios que ya tienen su llavero Konecta3D</p>
  </div>
  <!-- EDITA: sustituye cada .logo-chip por <div class="logo-chip"><img src="URL_DEL_LOGO" alt="Nombre"/></div> -->
  <div class="marquee" data-reveal>
    <div class="mtrack">
      <div class="logo-chip">TU CLIENTE 1</div><div class="logo-chip">TU CLIENTE 2</div>
      <div class="logo-chip">TU CLIENTE 3</div><div class="logo-chip">TU CLIENTE 4</div>
      <div class="logo-chip">TU CLIENTE 5</div><div class="logo-chip">TU CLIENTE 6</div>
      <div class="logo-chip">TU CLIENTE 7</div><div class="logo-chip">TU CLIENTE 8</div>
      <!-- duplicado para bucle continuo -->
      <div class="logo-chip">TU CLIENTE 1</div><div class="logo-chip">TU CLIENTE 2</div>
      <div class="logo-chip">TU CLIENTE 3</div><div class="logo-chip">TU CLIENTE 4</div>
      <div class="logo-chip">TU CLIENTE 5</div><div class="logo-chip">TU CLIENTE 6</div>
      <div class="logo-chip">TU CLIENTE 7</div><div class="logo-chip">TU CLIENTE 8</div>
    </div>
  </div>
</section>

<!-- ░░ URGENCIA ░░ -->
<section>
  <div class="wrap">
    <div class="card" data-reveal style="border-color:rgba(197,160,89,0.3);text-align:center;padding:44px">
      <div class="eyebrow center">Por qué empezar ahora</div>
      <h2 style="font-size:clamp(24px,3.5vw,34px)">Tu próxima feria es una fecha límite real</h2>
      <p class="section-lead center" style="font-size:17px">Fabricar tus llaveros con tu marca y dejar tu plataforma lista lleva tiempo. Si empiezas hoy, llegas con el sistema montado y probado. Si lo dejas para después, llegará otra feria más en la que pierdes a la gente.</p>
      <div class="cta-row" style="margin-top:26px"><a class="btn btn-gold" href="https://wa.me/34623759451?text=Hola%2C%20tengo%20una%20feria%20pr%C3%B3xima%20y%20quiero%20info%20de%20Konecta3D">Resérvalo para mi próxima feria</a></div>
    </div>
  </div>
</section>

<!-- ░░ FAQ / OBJECIONES ░░ -->
<section>
  <div class="wrap">
    <div class="eyebrow center" data-reveal>Antes de que preguntes</div>
    <h2 class="center" data-reveal style="margin-bottom:40px">Lo que suelen querer saber</h2>
    <div class="faq">
      <details class="q" data-reveal><summary>¿Es caro?</summary><div class="a">El llavero cuesta una fracción mínima de lo que ya inviertes en el stand. Es lo único que se queda con tus clientes después de la feria. Lo recuperas con un solo cliente nuevo.</div></details>
      <details class="q" data-reveal><summary>¿Necesito saber de tecnología?</summary><div class="a">No. Te lo dejamos configurado y tú lo gestionas desde un panel sencillo. El cliente solo acerca el móvil al llavero: no instala nada.</div></details>
      <details class="q" data-reveal><summary>Ya tengo un CRM, ¿esto lo reemplaza?</summary><div class="a">No lo reemplaza: lo alimenta. Konecta captura el contacto en la feria, justo donde hoy pierdes a la gente, y tú lo vuelcas a tu sistema.</div></details>
      <details class="q" data-reveal><summary>¿Y si no funciona?</summary><div class="a">Lo pruebas gratis un mes y lo ves con tus propios datos antes de pagar nada. Sin permanencia.</div></details>
    </div>
  </div>
</section>

<!-- ░░ CTA FINAL ░░ -->
<section>
  <div class="wrap">
    <div class="final" data-reveal>
      <h2>Que esta feria no sea otra que se te escapa</h2>
      <p class="section-lead center" style="font-size:18px;margin-bottom:28px">Cuéntanos cuándo es tu próximo evento y te enseñamos cómo llegar con el sistema funcionando.</p>
      <div class="cta-row"><a class="btn btn-gold" href="https://wa.me/34623759451?text=Hola%2C%20quiero%20info%20de%20Konecta3D%20para%20mi%20negocio">Hablar con Konecta3D</a></div>
      <p class="micro">Te respondemos personalmente. Sin compromiso.</p>
    </div>
  </div>
</section>

<footer>
  <div class="wrap">
    <div class="logo"><span class="mark">K</span> Konecta3D</div>
    <p>Convierte cada contacto en un cliente. · Presencia digital y captación para negocios locales.</p>
  </div>
</footer>

<script>
  (function(){
    var els = document.querySelectorAll('[data-reveal]');
    if(!('IntersectionObserver' in window)){els.forEach(function(e){e.classList.add('in')});return;}
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(en){ if(en.isIntersecting){ en.target.classList.add('in'); io.unobserve(en.target);} });
    },{threshold:0.12});
    els.forEach(function(e){io.observe(e)});
  })();
</script>
</body>
</html>`;
