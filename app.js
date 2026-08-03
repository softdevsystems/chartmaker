(() => {
  "use strict";

  const STORAGE_KEY = "systemflow-studio-project-v5";
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const uid = (prefix) => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  const escapeXml = (value = "") => String(value).replace(/[<>&'\"]/g, ch => ({"<":"&lt;",">":"&gt;","&":"&amp;","'":"&apos;",'"':"&quot;"}[ch]));

  let project = createBlankProject();
  let zoom = 1;
  let dragState = null;
  let suppressNodeClick = false;

  const els = {
    projectTitle: $("#projectTitle"),
    projectDescription: $("#projectDescription"),
    requirementsText: $("#requirementsText"),
    actorForm: $("#actorForm"), actorName: $("#actorName"), actorType: $("#actorType"), actorList: $("#actorList"),
    nodeForm: $("#nodeForm"), nodeId: $("#nodeId"), nodeLabel: $("#nodeLabel"), nodeActor: $("#nodeActor"), nodeType: $("#nodeType"), nodeDescription: $("#nodeDescription"), nodeList: $("#nodeList"),
    edgeForm: $("#edgeForm"), edgeFrom: $("#edgeFrom"), edgeTo: $("#edgeTo"), edgeLabel: $("#edgeLabel"), edgeList: $("#edgeList"),
    flowSvg: $("#flowSvg"), svgWrap: $("#svgWrap"), chartStage: $("#chartStage"), emptyState: $("#emptyState"), zoomLabel: $("#zoomLabel"),
    projectStatus: $("#projectStatus"), projectStatusDot: $("#projectStatusDot"), toast: $("#toast"),
    importSvgFile: $("#importSvgFile"),
    detailDialog: $("#detailDialog"), detailForm: $("#detailForm"), detailTitle: $("#detailTitle"), detailNodeId: $("#detailNodeId"), detailNodeLabel: $("#detailNodeLabel"), detailNodeActor: $("#detailNodeActor"), detailNodeType: $("#detailNodeType"), detailDescription: $("#detailDescription")
  };

  function createBlankProject() {
    return {
      version: 5,
      title: "",
      description: "",
      requirements: "",
      actors: [],
      nodes: [],
      edges: [],
      updatedAt: new Date().toISOString()
    };
  }

  function createMarketSample() {
    const A = {
      admin: "actor_admin",
      system: "actor_system",
      collector: "actor_collector",
      vendor: "actor_vendor",
      sms: "actor_sms"
    };
    const N = (id, actorId, type, label, order, description = "") => ({ id, actorId, type, label, order, description, manualY: null });
    const E = (from, to, label = "") => ({ id: uid("edge"), from, to, label });
    return {
      version: 5,
      title: "MARKET STALL AND VENDOR RENTAL COLLECTION MANAGEMENT SYSTEM",
      description: "An integrated process for vendor registration, digital stall assignment, rental collection, Cash Ticket validation, SMS notification, payment monitoring, and report generation.",
      requirements: [
        "Administrator logs in to the market management system.",
        "System validates the administrator credentials.",
        "Administrator registers the vendor and records the products being sold.",
        "System checks whether all Market Administrator requirements are complete.",
        "Administrator opens the interactive market map and selects an available location.",
        "System assigns the stall or non-stall space and creates the rental schedule.",
        "Collector searches for the vendor and records the rental payment.",
        "System validates the Cash Ticket Number and updates the remaining balance.",
        "SMS Service sends the payment confirmation to the vendor.",
        "System monitors payment deadlines and sends reminders for due accounts.",
        "Administrator generates occupancy, revenue, and vendor payment reports."
      ].join("\n"),
      actors: [
        { id: A.admin, name: "ADMINISTRATOR", type: "Administrator" },
        { id: A.system, name: "SYSTEM", type: "System" },
        { id: A.collector, name: "COLLECTOR", type: "User" },
        { id: A.vendor, name: "VENDOR", type: "User" },
        { id: A.sms, name: "SMS SERVICE", type: "External Service" }
      ],
      nodes: [
        N("n_start", A.admin, "startRound", "Start", 0),
        N("n_admin_login", A.admin, "input", "Administrator Logs In", 1, "The LGU Treasurer enters an authorized Administrator account."),
        N("n_validate_login", A.system, "process", "Validate Credentials", 2, "The system checks the submitted Administrator credentials."),
        N("n_login_valid", A.system, "decision", "Credentials Valid?", 3, "The system decides whether access should be granted."),
        N("n_register_vendor", A.admin, "input", "Register Vendor Profile", 4, "The Administrator records the vendor profile, owner photograph reference, contact information, and products sold."),
        N("n_check_requirements", A.system, "process", "Check Registration Requirements", 5, "The system checks the requirements provided by the Market Administrator."),
        N("n_requirements_complete", A.system, "decision", "Requirements Complete?", 6, "The system decides whether the vendor registration can proceed."),
        N("n_complete_requirements", A.admin, "process", "Complete Missing Requirements", 7, "The Administrator updates incomplete or rejected requirements."),
        N("n_generate_vendor_no", A.system, "process", "Generate Vendor Number", 8, "The system creates the unique vendor registration number."),
        N("n_open_map", A.admin, "process", "Open Interactive Market Map", 9, "The Administrator opens the digital market site map."),
        N("n_show_occupancy", A.system, "process", "Display Occupancy Status", 10, "The system displays occupied, available, reserved, and inactive spaces."),
        N("n_select_space", A.admin, "input", "Select Stall or Space", 11, "The Administrator selects the preferred stall or non-stall location."),
        N("n_space_available", A.system, "decision", "Space Available?", 12, "The system checks whether the selected location can be assigned."),
        N("n_assign_space", A.system, "process", "Assign Space and Mark Occupied", 13, "The system saves the assignment and updates the map status."),
        N("n_set_rental", A.admin, "input", "Set Rental Fee and Schedule", 14, "The Administrator sets the daily, weekly, or monthly rental schedule."),
        N("n_create_agreement", A.system, "document", "Create Rental Agreement", 15, "The system creates the rental agreement and payment due dates."),
        N("n_collector_login", A.collector, "input", "Collector Logs In", 16, "The Collector signs in using the registered account."),
        N("n_open_directory", A.collector, "process", "Open Vendor Directory", 17, "The Collector searches the assigned vendors and market locations."),
        N("n_show_vendor_account", A.system, "process", "Display Vendor Account", 18, "The system displays the vendor profile, schedule, history, and outstanding balance."),
        N("n_vendor_pays", A.vendor, "input", "Provide Rental Payment", 19, "The vendor provides the required rental payment to the Collector."),
        N("n_enter_payment", A.collector, "input", "Enter Payment and Cash Ticket", 20, "The Collector enters the amount, covered period, and Cash Ticket Number."),
        N("n_validate_ticket", A.system, "decision", "Cash Ticket Valid and Unused?", 21, "The system rejects missing, invalid, or duplicated Cash Ticket Numbers."),
        N("n_record_payment", A.system, "database", "Record Payment", 22, "The system records the transaction and the Collector who processed it."),
        N("n_update_balance", A.system, "process", "Update Vendor Balance", 23, "The system recalculates the paid amount and remaining balance."),
        N("n_send_confirmation", A.sms, "process", "Send Payment Confirmation", 24, "The SMS service sends the payment details to the vendor."),
        N("n_receive_confirmation", A.vendor, "document", "Receive SMS Confirmation", 25, "The vendor receives the amount, Cash Ticket Number, covered period, and remaining balance."),
        N("n_print_receipt", A.collector, "document", "Print Payment Acknowledgement", 26, "The Collector prints the payment acknowledgement for the vendor."),
        N("n_monitor_schedule", A.system, "process", "Monitor Payment Schedule", 27, "The system checks all active daily, weekly, and monthly rental schedules."),
        N("n_payment_due", A.system, "decision", "Payment Due or Overdue?", 28, "The system identifies accounts that need reminders."),
        N("n_send_reminder", A.sms, "process", "Send Payment Reminder", 29, "The SMS service sends a deadline or overdue notice."),
        N("n_receive_reminder", A.vendor, "document", "Receive Payment Reminder", 30, "The vendor receives the payment deadline or overdue notice."),
        N("n_select_report", A.admin, "input", "Select Report and Date Range", 31, "The Administrator selects occupancy, revenue, balance, or payment performance reports."),
        N("n_generate_report", A.system, "document", "Generate Requested Report", 32, "The system calculates the totals and prepares the report."),
        N("n_end", A.admin, "endRound", "End", 33)
      ],
      edges: [
        E("n_start", "n_admin_login"),
        E("n_admin_login", "n_validate_login"),
        E("n_validate_login", "n_login_valid"),
        E("n_login_valid", "n_register_vendor", "YES"),
        E("n_login_valid", "n_admin_login", "NO"),
        E("n_register_vendor", "n_check_requirements"),
        E("n_check_requirements", "n_requirements_complete"),
        E("n_requirements_complete", "n_generate_vendor_no", "YES"),
        E("n_requirements_complete", "n_complete_requirements", "NO"),
        E("n_complete_requirements", "n_check_requirements", "RESUBMIT"),
        E("n_generate_vendor_no", "n_open_map"),
        E("n_open_map", "n_show_occupancy"),
        E("n_show_occupancy", "n_select_space"),
        E("n_select_space", "n_space_available"),
        E("n_space_available", "n_assign_space", "YES"),
        E("n_space_available", "n_select_space", "NO"),
        E("n_assign_space", "n_set_rental"),
        E("n_set_rental", "n_create_agreement"),
        E("n_create_agreement", "n_collector_login"),
        E("n_collector_login", "n_open_directory"),
        E("n_open_directory", "n_show_vendor_account"),
        E("n_show_vendor_account", "n_vendor_pays"),
        E("n_vendor_pays", "n_enter_payment"),
        E("n_enter_payment", "n_validate_ticket"),
        E("n_validate_ticket", "n_record_payment", "YES"),
        E("n_validate_ticket", "n_enter_payment", "NO"),
        E("n_record_payment", "n_update_balance"),
        E("n_update_balance", "n_send_confirmation"),
        E("n_send_confirmation", "n_receive_confirmation"),
        E("n_receive_confirmation", "n_print_receipt"),
        E("n_print_receipt", "n_monitor_schedule"),
        E("n_monitor_schedule", "n_payment_due"),
        E("n_payment_due", "n_send_reminder", "YES"),
        E("n_payment_due", "n_select_report", "NO"),
        E("n_send_reminder", "n_receive_reminder"),
        E("n_receive_reminder", "n_select_report"),
        E("n_select_report", "n_generate_report"),
        E("n_generate_report", "n_end")
      ],
      updatedAt: new Date().toISOString()
    };
  }

  function setStatus(text, kind = "ok") {
    els.projectStatus.textContent = text;
    const colors = { ok: "#22c55e", busy: "#f59e0b", error: "#ef4444" };
    els.projectStatusDot.style.background = colors[kind] || colors.ok;
  }

  let toastTimer;
  function showToast(message) {
    els.toast.textContent = message;
    els.toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.toast.classList.remove("show"), 2500);
  }

  function markUpdated() {
    project.updatedAt = new Date().toISOString();
    setStatus("Unsaved changes", "busy");
  }

  function switchTab(name) {
    $$(".tab-btn").forEach(btn => btn.classList.toggle("active", btn.dataset.tab === name));
    $$(".tab-panel").forEach(panel => panel.classList.toggle("active", panel.id === `tab-${name}`));
  }

  function syncProjectInputs() {
    els.projectTitle.value = project.title || "";
    els.projectDescription.value = project.description || "";
    els.requirementsText.value = project.requirements || "";
  }

  function syncDetailActorOptions(selectedActorId = "") {
    if (!els.detailNodeActor) return;
    els.detailNodeActor.innerHTML = project.actors.length
      ? project.actors.map(a => `<option value="${escapeXml(a.id)}">${escapeXml(a.name)}</option>`).join("")
      : `<option value="">Add an actor first</option>`;
    if (selectedActorId && [...els.detailNodeActor.options].some(o => o.value === selectedActorId)) {
      els.detailNodeActor.value = selectedActorId;
    }
  }

  function updateSelects() {
    const actorOptions = project.actors.length
      ? project.actors.map(a => `<option value="${escapeXml(a.id)}">${escapeXml(a.name)}</option>`).join("")
      : `<option value="">Add an actor first</option>`;
    const actorCurrent = els.nodeActor.value;
    els.nodeActor.innerHTML = actorOptions;
    if ([...els.nodeActor.options].some(o => o.value === actorCurrent)) els.nodeActor.value = actorCurrent;

    const nodeOptions = project.nodes.length
      ? project.nodes.map(n => `<option value="${escapeXml(n.id)}">${escapeXml(n.label)}</option>`).join("")
      : `<option value="">Add a node first</option>`;
    [els.edgeFrom, els.edgeTo].forEach(select => {
      const current = select.value;
      select.innerHTML = nodeOptions;
      if ([...select.options].some(o => o.value === current)) select.value = current;
    });

    syncDetailActorOptions(els.detailNodeActor?.value || "");
  }

  function renderActorList() {
    els.actorList.innerHTML = project.actors.map((actor, index) => `
      <div class="item-card">
        <div class="item-card-head">
          <div><strong>${escapeXml(actor.name)}</strong><small>${escapeXml(actor.type)} · Lane ${index + 1}</small></div>
          <div class="item-actions">
            <button class="mini-btn" data-action="actor-up" data-id="${actor.id}" title="Move left">←</button>
            <button class="mini-btn" data-action="actor-down" data-id="${actor.id}" title="Move right">→</button>
            <button class="mini-btn" data-action="actor-delete" data-id="${actor.id}">Delete</button>
          </div>
        </div>
      </div>
    `).join("") || `<div class="tip-card">Add the people, systems, databases, or services that should have their own swimlanes.</div>`;
  }

  function renderNodeList() {
    els.nodeList.innerHTML = project.nodes.map((node, index) => {
      const actor = project.actors.find(a => a.id === node.actorId);
      return `<div class="item-card"><div class="item-card-head"><div><strong>${index + 1}. ${escapeXml(node.label)}</strong><small>${escapeXml(node.type)} · ${escapeXml(actor?.name || "Unassigned")}</small></div><div class="item-actions"><button class="mini-btn" data-action="node-edit" data-id="${node.id}">Edit</button><button class="mini-btn" data-action="node-delete" data-id="${node.id}">Delete</button></div></div></div>`;
    }).join("") || `<div class="tip-card">Nodes are the shapes in the chart. Use the requirements analyzer or add them manually.</div>`;

    els.edgeList.innerHTML = project.edges.map(edge => {
      const from = project.nodes.find(n => n.id === edge.from)?.label || "Missing";
      const to = project.nodes.find(n => n.id === edge.to)?.label || "Missing";
      return `<div class="item-card"><div class="item-card-head"><div><strong>${escapeXml(from)} → ${escapeXml(to)}</strong><small>${escapeXml(edge.label || "Unlabeled connection")}</small></div><button class="mini-btn" data-action="edge-delete" data-id="${edge.id}">Delete</button></div></div>`;
    }).join("");
  }

  function renderAll({ chart = true } = {}) {
    syncProjectInputs();
    updateSelects();
    renderActorList();
    renderNodeList();
    if (chart) renderChart();
  }

  function getNodeSize(type) {
    if (type === "decision") return { w: 168, h: 88 };
    if (type === "startRound") return { w: 72, h: 72 };
    if (type === "endRound") return { w: 72, h: 72 };
    if (type === "start") return { w: 72, h: 72 }; // Legacy editable SVG/browser save support.
    if (type === "startOval") return { w: 124, h: 70 };
    if (type === "database") return { w: 164, h: 76 };
    return { w: 174, h: 66 };
  }

  function getLayout() {
    const laneWidth = 270;
    const titleHeight = 50;
    const headerHeight = 58;
    const contentTop = titleHeight + headerHeight + 54;
    const rowGap = 116;
    const maxOrder = Math.max(0, ...project.nodes.map((n, i) => Number.isFinite(n.order) ? n.order : i));
    const height = Math.max(780, contentTop + (maxOrder + 2) * rowGap + 100);
    const width = Math.max(680, project.actors.length * laneWidth);
    const positions = {};
    project.nodes.forEach((node, index) => {
      const laneIndex = Math.max(0, project.actors.findIndex(a => a.id === node.actorId));
      positions[node.id] = {
        x: laneIndex * laneWidth + laneWidth / 2,
        y: Number.isFinite(node.manualY) ? node.manualY : contentTop + (Number.isFinite(node.order) ? node.order : index) * rowGap,
        ...getNodeSize(node.type)
      };
    });
    return { laneWidth, titleHeight, headerHeight, contentTop, rowGap, width, height, positions };
  }

  function wrapLines(text, maxChars = 22, maxLines = 4) {
    const words = String(text || "").split(/\s+/).filter(Boolean);
    const lines = [];
    let line = "";
    words.forEach(word => {
      const candidate = line ? `${line} ${word}` : word;
      if (candidate.length <= maxChars || !line) line = candidate;
      else { lines.push(line); line = word; }
    });
    if (line) lines.push(line);
    if (lines.length > maxLines) {
      const clipped = lines.slice(0, maxLines);
      clipped[maxLines - 1] = `${clipped[maxLines - 1].slice(0, Math.max(1, maxChars - 1))}…`;
      return clipped;
    }
    return lines;
  }

  function textSvg(label, x, y, maxChars = 23) {
    const lines = wrapLines(label, maxChars, 4);
    const startY = y - ((lines.length - 1) * 7);
    return `<text class="node-text">${lines.map((line, i) => `<tspan x="${x}" y="${startY + i * 14}">${escapeXml(line)}</tspan>`).join("")}</text>`;
  }

  function nodeShapeSvg(node, pos) {
    const x = pos.x, y = pos.y, w = pos.w, h = pos.h;
    const cls = `node-shape node-${node.type}`;
    if (node.type === "startRound" || node.type === "start") {
      const r = Math.min(w, h) / 2 - 3;
      return `<circle class="node-round-start" cx="${x}" cy="${y}" r="${r}" />`;
    }
    if (node.type === "endRound") {
      const outerR = Math.min(w, h) / 2 - 3;
      const innerR = outerR * 0.79;
      return `<circle class="node-round-end-outer" cx="${x}" cy="${y}" r="${outerR}"/><circle class="node-round-end-inner" cx="${x}" cy="${y}" r="${innerR}"/>`;
    }
    if (node.type === "startOval") return `<ellipse class="${cls}" cx="${x}" cy="${y}" rx="${w/2}" ry="${h/2}" />`;
    if (node.type === "decision") return `<polygon class="${cls}" points="${x},${y-h/2} ${x+w/2},${y} ${x},${y+h/2} ${x-w/2},${y}" />`;
    if (node.type === "input") {
      const skew = 18;
      return `<polygon class="${cls}" points="${x-w/2+skew},${y-h/2} ${x+w/2},${y-h/2} ${x+w/2-skew},${y+h/2} ${x-w/2},${y+h/2}" />`;
    }
    if (node.type === "database") {
      return `<path class="${cls}" d="M ${x-w/2},${y-h/2+10} C ${x-w/2},${y-h/2-4} ${x+w/2},${y-h/2-4} ${x+w/2},${y-h/2+10} L ${x+w/2},${y+h/2-10} C ${x+w/2},${y+h/2+4} ${x-w/2},${y+h/2+4} ${x-w/2},${y+h/2-10} Z M ${x-w/2},${y-h/2+10} C ${x-w/2},${y-h/2+24} ${x+w/2},${y-h/2+24} ${x+w/2},${y-h/2+10}" />`;
    }
    if (node.type === "document") {
      return `<path class="${cls}" d="M ${x-w/2},${y-h/2} H ${x+w/2} V ${y+h/2-10} Q ${x+w/4},${y+h/2+8} ${x},${y+h/2-5} Q ${x-w/4},${y+h/2-18} ${x-w/2},${y+h/2-4} Z" />`;
    }
    if (node.type === "subprocess") {
      return `<rect class="${cls}" x="${x-w/2}" y="${y-h/2}" width="${w}" height="${h}" rx="3" /><line x1="${x-w/2+13}" x2="${x-w/2+13}" y1="${y-h/2}" y2="${y+h/2}" stroke="#ac7f2a"/><line x1="${x+w/2-13}" x2="${x+w/2-13}" y1="${y-h/2}" y2="${y+h/2}" stroke="#ac7f2a"/>`;
    }
    return `<rect class="${cls}" x="${x-w/2}" y="${y-h/2}" width="${w}" height="${h}" rx="3" />`;
  }

  function edgePath(source, target, edgeIndex, samePairCount) {
    const sx = source.x;
    const sy = source.y + source.h / 2;
    const tx = target.x;
    const ty = target.y - target.h / 2;
    if (ty > sy + 25) {
      const midY = sy + Math.max(28, (ty - sy) / 2);
      return { d: `M ${sx} ${sy} V ${midY} H ${tx} V ${ty}`, lx: (sx + tx) / 2, ly: midY - 5 };
    }
    const detour = 42 + edgeIndex * 10 + samePairCount * 4;
    const direction = tx >= sx ? 1 : -1;
    const sideX = sx + direction * detour;
    const bottomY = Math.max(sy, ty) + 58 + edgeIndex * 8;
    return { d: `M ${sx} ${sy} V ${bottomY} H ${sideX} H ${tx} V ${ty}`, lx: (sideX + tx) / 2, ly: bottomY - 5 };
  }

  function renderChart() {
    if (!project.actors.length || !project.nodes.length) {
      els.emptyState.classList.remove("hidden");
      els.flowSvg.innerHTML = "";
      els.flowSvg.setAttribute("width", "0");
      els.flowSvg.setAttribute("height", "0");
      return;
    }
    els.emptyState.classList.add("hidden");
    const L = getLayout();
    els.flowSvg.setAttribute("viewBox", `0 0 ${L.width} ${L.height}`);
    els.flowSvg.setAttribute("width", L.width);
    els.flowSvg.setAttribute("height", L.height);

    const title = escapeXml(project.title || "SYSTEM FLOWCHART");
    const subtitle = escapeXml(project.description || "Cross-functional swimlane process diagram");
    const defs = `<defs>
      <filter id="nodeShadow" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#1f2937" flood-opacity="0.15"/></filter>
      <marker id="arrow" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L10,4 L0,8 z" fill="#a68b19"/></marker>
    </defs>`;

    let lanes = `<rect x="0" y="0" width="${L.width}" height="${L.titleHeight}" fill="#f4f6f8" stroke="#aab6c6"/><text class="chart-title" x="12" y="24">${title}</text><text class="chart-subtitle" x="12" y="41">${subtitle}</text>`;
    project.actors.forEach((actor, i) => {
      const x = i * L.laneWidth;
      lanes += `<rect class="lane-bg ${i % 2 ? "lane-alt" : ""}" x="${x}" y="${L.titleHeight}" width="${L.laneWidth}" height="${L.height - L.titleHeight}"/>`;
      lanes += `<rect class="lane-header" x="${x}" y="${L.titleHeight}" width="${L.laneWidth}" height="${L.headerHeight}"/>`;
      lanes += `<text class="lane-title" x="${x + L.laneWidth/2}" y="${L.titleHeight + 36}">${escapeXml(actor.name)}</text>`;
    });

    const pairCounts = new Map();
    let edgesSvg = "";
    project.edges.forEach((edge, index) => {
      const source = L.positions[edge.from];
      const target = L.positions[edge.to];
      if (!source || !target) return;
      const key = `${edge.from}|${edge.to}`;
      const count = pairCounts.get(key) || 0;
      pairCounts.set(key, count + 1);
      const p = edgePath(source, target, index % 5, count);
      edgesSvg += `<path class="edge" d="${p.d}" data-edge-id="${edge.id}"/>`;
      if (edge.label) {
        const labelWidth = Math.max(28, edge.label.length * 7 + 10);
        edgesSvg += `<rect class="edge-label-bg" x="${p.lx-labelWidth/2}" y="${p.ly-11}" width="${labelWidth}" height="16" rx="4"/><text class="edge-label" x="${p.lx}" y="${p.ly}">${escapeXml(edge.label)}</text>`;
      }
    });

    let nodesSvg = "";
    project.nodes.forEach(node => {
      const pos = L.positions[node.id];
      const hideRoundLabel = node.type === "startRound" || node.type === "endRound" || node.type === "start";
      const nodeLabelSvg = hideRoundLabel ? "" : textSvg(node.label, pos.x, pos.y, node.type === "decision" ? 18 : 23);
      nodesSvg += `<g class="node-group" data-node-id="${node.id}" tabindex="0" aria-label="${escapeXml(node.label)}">${nodeShapeSvg(node, pos)}${nodeLabelSvg}</g>`;
    });

    els.flowSvg.innerHTML = defs + lanes + edgesSvg + nodesSvg;
    els.svgWrap.style.transform = `scale(${zoom})`;
    attachNodeInteractions();
  }

  function attachNodeInteractions() {
    $$(".node-group", els.flowSvg).forEach(group => {
      group.addEventListener("click", () => {
        if (suppressNodeClick) return;
        openNodeDetail(group.dataset.nodeId);
      });
      group.addEventListener("keydown", e => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openNodeDetail(group.dataset.nodeId);
        }
      });
      group.addEventListener("pointerdown", e => {
        if (e.button !== 0) return;
        const node = project.nodes.find(n => n.id === group.dataset.nodeId);
        if (!node) return;
        const pt = svgPoint(e);
        const pos = getLayout().positions[node.id];
        dragState = { node, offsetY: pt.y - pos.y, moved: false };
        group.setPointerCapture(e.pointerId);
      });
      group.addEventListener("pointermove", e => {
        if (!dragState || dragState.node.id !== group.dataset.nodeId) return;
        const pt = svgPoint(e);
        dragState.node.manualY = Math.max(150, pt.y - dragState.offsetY);
        dragState.moved = true;
        renderChart();
      });
      group.addEventListener("pointerup", () => {
        if (dragState?.moved) {
          suppressNodeClick = true;
          markUpdated();
          showToast("Node position updated");
          setTimeout(() => { suppressNodeClick = false; }, 120);
        }
        dragState = null;
      });
    });
  }

  function svgPoint(event) {
    const pt = els.flowSvg.createSVGPoint();
    pt.x = event.clientX; pt.y = event.clientY;
    const matrix = els.flowSvg.getScreenCTM();
    return matrix ? pt.matrixTransform(matrix.inverse()) : { x: event.clientX, y: event.clientY };
  }

  function openNodeDetail(nodeId) {
    const node = project.nodes.find(n => n.id === nodeId);
    if (!node) return;
    els.detailTitle.textContent = "Edit flow step";
    els.detailNodeId.value = node.id;
    els.detailNodeLabel.value = node.label || "";
    syncDetailActorOptions(node.actorId);
    els.detailNodeType.value = node.type || "process";
    els.detailDescription.value = node.description || "";
    els.detailDialog.showModal();
    setTimeout(() => els.detailNodeLabel.focus(), 80);
  }

  function saveDetailForm() {
    const node = project.nodes.find(n => n.id === els.detailNodeId.value);
    if (!node) return;
    const label = els.detailNodeLabel.value.trim();
    if (!label) return showToast("Step label is required.");
    node.label = label;
    node.actorId = els.detailNodeActor.value;
    node.type = els.detailNodeType.value;
    node.description = els.detailDescription.value.trim();
    markUpdated();
    renderAll();
    els.detailDialog.close();
    showToast("Flow step updated.");
  }

  function deleteDetailNode() {
    const nodeId = els.detailNodeId.value;
    const node = project.nodes.find(n => n.id === nodeId);
    if (!node) return;
    if (!confirm(`Delete this step?\n\n${node.label}`)) return;
    project.nodes = project.nodes.filter(n => n.id !== nodeId);
    project.edges = project.edges.filter(edge => edge.from !== nodeId && edge.to !== nodeId);
    markUpdated();
    renderAll();
    els.detailDialog.close();
    showToast("Flow step deleted.");
  }

  function resetNodeForm() {
    els.nodeForm.reset();
    els.nodeId.value = "";
    updateSelects();
  }

  const ACTOR_CATALOG = [
    { name: "Administrator", type: "Administrator", aliases: ["administrator", "admin", "system administrator", "lgu treasurer", "treasurer"] },
    { name: "System", type: "System", aliases: ["system", "application", "software", "platform", "portal", "server"] },
    { name: "Database", type: "Database", aliases: ["database", "data store", "repository"] },
    { name: "Teacher", type: "User", aliases: ["teacher", "instructor", "trainer", "faculty"] },
    { name: "Passenger", type: "User", aliases: ["passenger", "commuter", "traveler", "traveller"] },
    { name: "Driver", type: "User", aliases: ["driver", "vehicle driver", "operator driver"] },
    { name: "Student", type: "User", aliases: ["student", "learner", "pupil", "trainee"] },
    { name: "Head", type: "Administrator", aliases: ["head", "school head", "department head", "office head", "unit head", "principal", "dean", "director"] },
    { name: "Rider", type: "User", aliases: ["rider", "delivery rider", "courier"] },
    { name: "Collector", type: "User", aliases: ["collector", "revenue collector", "collection officer"] },
    { name: "Cashier", type: "User", aliases: ["cashier", "payment cashier", "teller"] },
    { name: "Registrar", type: "User", aliases: ["registrar", "civil registrar", "school registrar"] },
    { name: "Vendor", type: "User", aliases: ["vendor", "stall owner", "merchant", "seller"] },
    { name: "Customer", type: "User", aliases: ["customer", "client", "consumer", "buyer"] },
    { name: "Librarian", type: "User", aliases: ["librarian", "library staff"] },
    { name: "Staff", type: "User", aliases: ["staff", "employee", "personnel", "clerk", "encoder", "secretary"] },
    { name: "Manager", type: "Administrator", aliases: ["manager", "supervisor", "coordinator", "administrator in charge"] },
    { name: "Approver", type: "User", aliases: ["approver", "reviewer", "evaluator", "assessor"] },
    { name: "Requestor", type: "User", aliases: ["requestor", "requester", "applicant"] },
    { name: "Parent", type: "User", aliases: ["parent", "guardian"] },
    { name: "Doctor", type: "User", aliases: ["doctor", "physician"] },
    { name: "Nurse", type: "User", aliases: ["nurse"] },
    { name: "Patient", type: "User", aliases: ["patient"] },
    { name: "Receptionist", type: "User", aliases: ["receptionist", "front desk"] },
    { name: "Technician", type: "User", aliases: ["technician", "it technician", "repair technician", "mechanic"] },
    { name: "Supplier", type: "User", aliases: ["supplier", "provider"] },
    { name: "Owner", type: "User", aliases: ["owner", "business owner"] },
    { name: "Security", type: "User", aliases: ["security", "security guard", "guard"] },
    { name: "Dispatcher", type: "User", aliases: ["dispatcher", "booking dispatcher"] },
    { name: "Accountant", type: "User", aliases: ["accountant", "finance officer", "budget officer"] },
    { name: "Auditor", type: "User", aliases: ["auditor"] },
    { name: "SMS Service", type: "External Service", aliases: ["sms service", "sms api", "text service", "messaging service"] },
    { name: "Email Service", type: "External Service", aliases: ["email service", "mail service", "email api"] },
    { name: "Payment Gateway", type: "External Service", aliases: ["payment gateway", "online payment service", "e-wallet service", "ewallet service"] },
    { name: "External API", type: "External Service", aliases: ["external api", "third-party api", "third party api", "web service"] },
    { name: "Printer", type: "Device", aliases: ["printer", "thermal printer", "receipt printer"] },
    { name: "Scanner", type: "Device", aliases: ["scanner", "qr scanner", "barcode scanner"] },
    { name: "Device", type: "Device", aliases: ["device", "mobile device", "computer", "terminal"] }
  ];

  const ACTION_VERBS = [
    "logs in", "logs out", "signs in", "signs out", "opens", "closes", "registers", "uploads", "records", "selects", "chooses", "checks", "validates", "displays", "assigns", "sets", "creates", "generates", "views", "searches", "receives", "enters", "submits", "prints", "sends", "monitors", "marks", "reviews", "verifies", "confirms", "updates", "calculates", "provides", "pays", "requests", "approves", "rejects", "scans", "books", "drives", "collects", "issues", "manages", "maintains", "notifies", "processes", "stores", "saves", "deletes", "edits", "adds", "accesses", "completes", "corrects", "releases", "forwards", "accepts", "cancels", "dispatches", "delivers", "prepares", "encodes", "evaluates", "assesses", "attaches", "downloads", "exports", "imports", "returns", "resolves", "responds", "starts", "stops", "activates", "deactivates", "revises", "remits", "acknowledges", "serves", "boards", "drops off", "files", "schedules"
  ];

  function escapeRegex(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function singularizeRole(value) {
    const low = value.toLowerCase();
    const fixed = {
      "students": "student", "learners": "learner", "teachers": "teacher", "passengers": "passenger",
      "drivers": "driver", "riders": "rider", "collectors": "collector", "cashiers": "cashier",
      "registrars": "registrar", "vendors": "vendor", "customers": "customer", "clients": "client",
      "librarians": "librarian", "administrators": "administrator", "managers": "manager",
      "parents": "parent", "guardians": "guardian", "doctors": "doctor", "nurses": "nurse",
      "patients": "patient", "technicians": "technician", "suppliers": "supplier", "owners": "owner",
      "auditors": "auditor", "printers": "printer", "scanners": "scanner", "devices": "device"
    };
    return fixed[low] || value;
  }

  function titleCaseRole(value) {
    const acronyms = new Set(["lgu", "sms", "api", "it", "hr", "ict", "qr", "pos", "meo"]);
    return value.toLowerCase().split(/\s+/).filter(Boolean).map(word => {
      if (acronyms.has(word)) return word.toUpperCase();
      return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(" ");
  }

  function catalogMatch(rawName) {
    const cleaned = singularizeRole(String(rawName || "")
      .replace(/^[-*\d.)\s]+/, "")
      .replace(/^(the|a|an)\s+/i, "")
      .replace(/[,:;.!?]+$/g, "")
      .replace(/\s+/g, " ")
      .trim());
    const low = cleaned.toLowerCase();
    for (const item of ACTOR_CATALOG) {
      if (item.name.toLowerCase() === low || item.aliases.some(alias => singularizeRole(alias).toLowerCase() === low)) return item;
    }
    return null;
  }

  function normalizeActorName(rawName) {
    let cleaned = String(rawName || "")
      .replace(/^[-*\d.)\s]+/, "")
      .replace(/^(the|a|an)\s+/i, "")
      .replace(/\b(account|role|user)\s*$/i, match => /account/i.test(match) ? "" : match)
      .replace(/[,:;.!?]+$/g, "")
      .replace(/\s+/g, " ")
      .trim();
    cleaned = singularizeRole(cleaned);
    const known = catalogMatch(cleaned);
    if (known) return known.name;
    if (!cleaned || cleaned.length > 55 || cleaned.split(/\s+/).length > 7) return "";
    if (/^(start|end|yes|no|if|when|then|otherwise|process|step|requirement|system requirement)$/i.test(cleaned)) return "";
    return titleCaseRole(cleaned);
  }

  function actorTypeForName(name) {
    const known = catalogMatch(name);
    if (known) return known.type;
    const low = String(name).toLowerCase();
    if (/database|repository|data store/.test(low)) return "Database";
    if (/system|application|software|platform|portal|server/.test(low)) return "System";
    if (/service|gateway|api/.test(low)) return "External Service";
    if (/printer|scanner|device|terminal|computer|kiosk/.test(low)) return "Device";
    if (/administrator|admin|head|principal|manager|supervisor|director|dean|treasurer/.test(low)) return "Administrator";
    return "User";
  }

  function actorKey(name) {
    const normalized = normalizeActorName(name) || String(name || "").trim();
    const known = catalogMatch(normalized);
    return (known?.name || normalized).toLowerCase().replace(/[^a-z0-9]+/g, "");
  }

  function findActorByName(name) {
    const key = actorKey(name);
    return project.actors.find(actor => actorKey(actor.name) === key) || null;
  }

  function ensureActor(name, type = "") {
    const normalized = normalizeActorName(name);
    if (!normalized) return null;
    const existing = findActorByName(normalized);
    if (existing) return existing;
    const actor = { id: uid("actor"), name: normalized.toUpperCase(), type: type || actorTypeForName(normalized) };
    project.actors.push(actor);
    return actor;
  }

  function extractExplicitActor(text) {
    const cleaned = String(text || "").replace(/^\s*[-*\d.)]+\s*/, "").trim();
    const colon = cleaned.match(/^([A-Za-z][A-Za-z0-9/&()'., -]{0,54})\s*:\s*(.+)$/);
    if (colon) {
      const role = normalizeActorName(colon[1]);
      if (role) return role;
    }
    const dash = cleaned.match(/^([A-Za-z][A-Za-z0-9/&()'., -]{0,54})\s+[–—-]\s+(.+)$/);
    if (dash) {
      const role = normalizeActorName(dash[1]);
      if (role) return role;
    }
    return "";
  }

  function extractLeadingActor(text) {
    const cleaned = String(text || "").replace(/^\s*[-*\d.)]+\s*/, "").trim();
    const modalMatch = cleaned.match(/^(?:the\s+)?([A-Za-z][A-Za-z0-9/&()'., -]{0,54}?)\s+(?:can|will|must|should|may|shall)\s+[A-Za-z]+\b/i);
    if (modalMatch) return normalizeActorName(modalMatch[1]);
    const verbs = ACTION_VERBS.map(escapeRegex).sort((a, b) => b.length - a.length).join("|");
    const match = cleaned.match(new RegExp(`^(?:the\\s+)?([A-Za-z][A-Za-z0-9/&()'., -]{0,54}?)\\s+(?:${verbs})\\b`, "i"));
    if (!match) return "";
    return normalizeActorName(match[1]);
  }

  function extractPassiveActor(text) {
    const match = String(text || "").match(/\bby\s+(?:the\s+)?([A-Za-z][A-Za-z0-9/&()' -]{1,45})[.!?]?$/i);
    return match ? normalizeActorName(match[1]) : "";
  }

  function extractActorFromStep(text) {
    return extractExplicitActor(text) || extractLeadingActor(text) || extractPassiveActor(text);
  }

  function detectCatalogActors(text) {
    const detected = [];
    const low = String(text || "").toLowerCase();
    ACTOR_CATALOG.forEach(item => {
      const names = [item.name, ...item.aliases].sort((a, b) => b.length - a.length);
      if (names.some(alias => new RegExp(`\\b${escapeRegex(alias)}s?\\b`, "i").test(low))) detected.push(item);
    });
    return detected;
  }

  function actorForText(text, fallbackActorId = "") {
    const explicitName = extractActorFromStep(text);
    if (explicitName) {
      const actor = ensureActor(explicitName);
      if (actor) return actor.id;
    }

    const low = String(text || "").toLowerCase();
    for (const item of ACTOR_CATALOG) {
      const aliases = [item.name, ...item.aliases];
      if (aliases.some(alias => new RegExp(`\\b${escapeRegex(alias)}s?\\b`, "i").test(low))) {
        const actor = findActorByName(item.name) || ensureActor(item.name, item.type);
        if (actor) return actor.id;
      }
    }

    const system = findActorByName("System");
    if (/validate|check|monitor|calculate|trigger|send|store|save|update|delete|generate|notify|process|authenticate|display|record|assign|mark|compute|verify/i.test(low) && system) return system.id;
    return fallbackActorId || project.actors[0]?.id || "";
  }

  function inferType(text) {
    const low = text.toLowerCase();
    if (/^(start|begin)\b/.test(low)) return "startRound";
    if (/\bend\b|logout|log out|sign out/.test(low)) return "endRound";
    if (/\?|\bif\b|whether|correct|valid|available|approved|reached|greater than|less than|equal to|complete\?|successful\?|exists\?/.test(low)) return "decision";
    if (/enter|input|fill|select|choose|scan|upload|register|credentials|submit|provide|receive|request/.test(low)) return "input";
    if (/database|store record|save record|record payment|save transaction/.test(low)) return "database";
    if (/report|receipt|document|mobile number|sms message|certificate|form|ticket/.test(low)) return "document";
    if (/add,? edit,? delete|crud|subprocess|borrowed books|qr code scanning/.test(low)) return "subprocess";
    return "process";
  }

  function stripActorPrefix(text) {
    const cleaned = String(text || "").replace(/^[-*\d.)\s]+/, "").trim();
    const explicit = cleaned.match(/^([A-Za-z][A-Za-z0-9/&()'., -]{0,54})\s*:\s*(.+)$/);
    if (explicit && normalizeActorName(explicit[1])) return explicit[2].trim();
    const dash = cleaned.match(/^([A-Za-z][A-Za-z0-9/&()'., -]{0,54})\s+[–—-]\s+(.+)$/);
    if (dash && normalizeActorName(dash[1])) return dash[2].trim();
    const modal = cleaned.match(/^(?:the\s+)?([A-Za-z][A-Za-z0-9/&()'., -]{0,54}?)\s+(?:can|will|must|should|may|shall)\s+(.+)$/i);
    if (modal && normalizeActorName(modal[1])) return modal[2].trim();
    const verbs = ACTION_VERBS.map(escapeRegex).sort((a, b) => b.length - a.length).join("|");
    const leading = cleaned.match(new RegExp(`^(?:the\\s+)?([A-Za-z][A-Za-z0-9/&()'., -]{0,54}?)\\s+((?:${verbs})\\b.*)$`, "i"));
    if (leading && normalizeActorName(leading[1])) return leading[2].trim();
    return cleaned;
  }

  function cleanLabel(text) {
    return stripActorPrefix(text).trim().replace(/[.;]+$/, "").replace(/^./, s => s.toUpperCase()).slice(0, 80);
  }

  function analyzeRequirements() {
    project.title = els.projectTitle.value.trim();
    project.description = els.projectDescription.value.trim();
    project.requirements = els.requirementsText.value.trim();
    const text = project.requirements;
    if (!text) return showToast("Enter system requirements first.");

    const steps = text.split(/\n+|(?<=[.!?])\s+/).map(s => s.trim()).filter(s => s.length > 3);
    if (!steps.length) return showToast("No process steps were detected.");

    // Rebuild swimlanes from the current requirements in first-appearance order.
    project.actors = [];
    steps.forEach(step => {
      const detectedRole = extractActorFromStep(step);
      if (detectedRole) ensureActor(detectedRole);
    });
    // Add any known roles mentioned as recipients or supporting components.
    detectCatalogActors(text).forEach(item => ensureActor(item.name, item.type));

    if (!project.actors.length) {
      ensureActor("User", "User");
      ensureActor("System", "System");
    }

    project.nodes = [];
    project.edges = [];
    const startActor = project.actors[0].id;
    const startNode = { id: uid("node"), actorId: startActor, type: "startRound", label: "Start", description: "Beginning of the documented process.", order: 0, manualY: null };
    project.nodes.push(startNode);
    let previous = startNode;
    steps.forEach((step, index) => {
      const type = inferType(step);
      const node = { id: uid("node"), actorId: actorForText(step, startActor), type, label: cleanLabel(step), description: step, order: index + 1, manualY: null };
      project.nodes.push(node);
      project.edges.push({ id: uid("edge"), from: previous.id, to: node.id, label: "" });
      previous = node;
    });
    if (previous.type !== "endRound" || !/end|logout|log out|sign out/i.test(previous.label)) {
      const endNode = { id: uid("node"), actorId: startActor, type: "endRound", label: "End", description: "End of the generated process.", order: steps.length + 1, manualY: null };
      project.nodes.push(endNode);
      project.edges.push({ id: uid("edge"), from: previous.id, to: endNode.id, label: "" });
    }
    markUpdated();
    renderAll();
    switchTab("flow");
    showToast(`Detected ${project.actors.length} actors and generated ${project.nodes.length} nodes.`);
  }

  function autoLayout() {
    project.nodes.forEach((n, i) => { n.order = i; n.manualY = null; });
    markUpdated();
    renderChart();
    showToast("Nodes arranged by flow order.");
  }

  function saveBrowser() {
    try {
      project.title = els.projectTitle.value.trim();
      project.description = els.projectDescription.value.trim();
      project.requirements = els.requirementsText.value.trim();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
      setStatus("Saved in this browser", "ok");
      showToast("Project saved in this browser.");
    } catch (error) {
      setStatus("Save failed", "error");
      showToast("Browser storage is full. Export the project JSON instead.");
    }
  }

  function loadBrowser() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return false;
    try {
      project = normalizeProject(JSON.parse(saved));
      renderAll();
      setStatus("Browser save loaded", "ok");
      return true;
    } catch { return false; }
  }

  function normalizeProject(data) {
    const p = { ...createBlankProject(), ...data };
    p.version = 5;
    p.actors = Array.isArray(p.actors) ? p.actors : [];
    delete p.pages;
    p.nodes = Array.isArray(p.nodes) ? p.nodes.map((n, i) => {
      const { pageId, ...node } = n || {};
      const normalizedNode = { order: i, manualY: null, description: "", ...node };
      if (normalizedNode.type === "start") {
        normalizedNode.type = /end|logout|log out|sign out/i.test(normalizedNode.label || "") ? "endRound" : "startRound";
      }
      return normalizedNode;
    }) : [];
    p.edges = Array.isArray(p.edges) ? p.edges : [];
    return p;
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function safeFilename(ext) {
    const base = (project.title || "system-flowchart").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "system-flowchart";
    return `${base}.${ext}`;
  }

  function encodeBase64Utf8(value) {
    const bytes = new TextEncoder().encode(String(value));
    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary);
  }

  function decodeBase64Utf8(value) {
    const binary = atob(String(value).replace(/\s+/g, ""));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  function serializeSvg() {
    syncProjectForExport();
    const clone = els.flowSvg.cloneNode(true);
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.setAttribute("data-systemflow-format", "editable-svg-v1");

    const oldMetadata = clone.querySelector("#systemflow-project");
    if (oldMetadata) oldMetadata.remove();

    const metadata = document.createElementNS("http://www.w3.org/2000/svg", "metadata");
    metadata.setAttribute("id", "systemflow-project");
    metadata.setAttribute("data-encoding", "base64-utf8-json");
    metadata.textContent = encodeBase64Utf8(JSON.stringify(project));

    const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
    style.textContent = [...document.styleSheets]
      .filter(sheet => !sheet.href || sheet.href.endsWith("styles.css"))
      .flatMap(sheet => {
        try { return [...sheet.cssRules].map(rule => rule.cssText); } catch { return []; }
      }).join("\n");

    clone.insertBefore(style, clone.firstChild);
    clone.insertBefore(metadata, clone.firstChild);
    return new XMLSerializer().serializeToString(clone);
  }

  function exportSvg() {
    if (!project.nodes.length) return showToast("Generate a chart first.");
    downloadBlob(new Blob([serializeSvg()], { type: "image/svg+xml;charset=utf-8" }), safeFilename("svg"));
    showToast("Editable SVG exported.");
  }

  function validateImportedProject(data) {
    return data && typeof data === "object" && Array.isArray(data.actors) && Array.isArray(data.nodes) && Array.isArray(data.edges);
  }

  async function importEditableSvg(file) {
    if (!file) return;
    try {
      const svgText = await file.text();
      const doc = new DOMParser().parseFromString(svgText, "image/svg+xml");
      if (doc.querySelector("parsererror")) throw new Error("The selected file is not a valid SVG document.");

      const metadata = doc.querySelector("metadata#systemflow-project");
      if (!metadata) {
        throw new Error("This SVG has no editable Chart Builder project data. Import an SVG exported by this updated Chart Builder.");
      }

      const encoding = metadata.getAttribute("data-encoding") || "base64-utf8-json";
      if (encoding !== "base64-utf8-json") throw new Error("The SVG project-data format is not supported.");

      const imported = JSON.parse(decodeBase64Utf8(metadata.textContent || ""));
      if (!validateImportedProject(imported)) throw new Error("The SVG contains incomplete or invalid project data.");

      project = normalizeProject(imported);
      resetNodeForm();
      renderAll();
      setStatus("Editable SVG imported", "ok");
      requestAnimationFrame(() => fitChart());
      showToast("SVG imported. You can edit the chart again.");
    } catch (error) {
      setStatus("SVG import failed", "error");
      showToast(error?.message || "Unable to import the SVG file.");
    } finally {
      els.importSvgFile.value = "";
    }
  }

  function getHighQualityScale(viewBox) {
    const desiredScale = 4;
    const maxDimension = 16000;
    const maxPixelArea = 80000000;
    const width = Math.max(1, viewBox.width);
    const height = Math.max(1, viewBox.height);
    const dimensionScale = Math.min(maxDimension / width, maxDimension / height);
    const areaScale = Math.sqrt(maxPixelArea / (width * height));
    return Math.max(0.5, Math.min(desiredScale, dimensionScale, areaScale));
  }

  function exportPng() {
    if (!project.nodes.length) return showToast("Generate a chart first.");
    const svgText = serializeSvg();
    const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const vb = els.flowSvg.viewBox.baseVal;
      const scale = getHighQualityScale(vb);
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.ceil(vb.width * scale));
      canvas.height = Math.max(1, Math.ceil(vb.height * scale));
      const ctx = canvas.getContext("2d", { alpha: false });
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(pngBlob => {
        if (pngBlob) {
          downloadBlob(pngBlob, safeFilename("png"));
          showToast(`Ultra HD PNG exported at ${scale.toFixed(1)}× resolution.`);
        } else {
          showToast("PNG export failed. Use the editable SVG for unlimited scaling.");
        }
        URL.revokeObjectURL(url);
      }, "image/png");
    };
    img.onerror = () => { URL.revokeObjectURL(url); showToast("PNG export failed. Try SVG export."); };
    img.src = url;
  }

  function exportJson() {
    project.title = els.projectTitle.value.trim();
    project.description = els.projectDescription.value.trim();
    project.requirements = els.requirementsText.value.trim();
    downloadBlob(new Blob([JSON.stringify(project, null, 2)], { type: "application/json" }), safeFilename("json"));
  }


  function syncProjectForExport() {
    project.title = els.projectTitle.value.trim();
    project.description = els.projectDescription.value.trim();
    project.requirements = els.requirementsText.value.trim();
  }

  function canvasToBlob(canvas, type = "image/png", quality = 0.92) {
    return new Promise((resolve, reject) => {
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Canvas export failed.")), type, quality);
    });
  }

  function renderChartCanvas(type = "image/png") {
    if (!project.nodes.length) return Promise.reject(new Error("Generate a chart first."));

    const svgText = serializeSvg();
    const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          const vb = els.flowSvg.viewBox.baseVal;
          const scale = getHighQualityScale(vb);
          const canvas = document.createElement("canvas");
          canvas.width = Math.ceil(vb.width * scale);
          canvas.height = Math.ceil(vb.height * scale);
          const ctx = canvas.getContext("2d", { alpha: false });
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          URL.revokeObjectURL(url);
          resolve(canvas);
        } catch (error) {
          URL.revokeObjectURL(url);
          reject(error);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error(`${type.toUpperCase()} export failed. Try SVG export.`));
      };
      img.src = url;
    });
  }

  function textBytes(value) {
    return new TextEncoder().encode(String(value));
  }

  function concatBytes(parts) {
    const total = parts.reduce((sum, part) => sum + part.length, 0);
    const out = new Uint8Array(total);
    let offset = 0;
    parts.forEach(part => { out.set(part, offset); offset += part.length; });
    return out;
  }

  const crcTable = (() => {
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c >>> 0;
    }
    return table;
  })();

  function crc32(bytes) {
    let crc = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) crc = crcTable[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
  }

  function zipDateTime(date = new Date()) {
    const time = ((date.getHours() & 31) << 11) | ((date.getMinutes() & 63) << 5) | ((Math.floor(date.getSeconds() / 2)) & 31);
    const dosDate = (((date.getFullYear() - 1980) & 127) << 9) | (((date.getMonth() + 1) & 15) << 5) | (date.getDate() & 31);
    return { time, date: dosDate };
  }

  function writeU16(view, offset, value) { view.setUint16(offset, value, true); }
  function writeU32(view, offset, value) { view.setUint32(offset, value >>> 0, true); }

  function makeZip(files) {
    const localParts = [];
    const centralParts = [];
    let offset = 0;
    const stamp = zipDateTime();

    files.forEach(file => {
      const nameBytes = textBytes(file.name);
      const data = typeof file.data === "string" ? textBytes(file.data) : file.data instanceof Uint8Array ? file.data : new Uint8Array(file.data);
      const crc = crc32(data);

      const localHeader = new Uint8Array(30);
      const lh = new DataView(localHeader.buffer);
      writeU32(lh, 0, 0x04034b50);
      writeU16(lh, 4, 20);
      writeU16(lh, 6, 0);
      writeU16(lh, 8, 0);
      writeU16(lh, 10, stamp.time);
      writeU16(lh, 12, stamp.date);
      writeU32(lh, 14, crc);
      writeU32(lh, 18, data.length);
      writeU32(lh, 22, data.length);
      writeU16(lh, 26, nameBytes.length);
      writeU16(lh, 28, 0);

      localParts.push(localHeader, nameBytes, data);

      const centralHeader = new Uint8Array(46);
      const ch = new DataView(centralHeader.buffer);
      writeU32(ch, 0, 0x02014b50);
      writeU16(ch, 4, 20);
      writeU16(ch, 6, 20);
      writeU16(ch, 8, 0);
      writeU16(ch, 10, 0);
      writeU16(ch, 12, stamp.time);
      writeU16(ch, 14, stamp.date);
      writeU32(ch, 16, crc);
      writeU32(ch, 20, data.length);
      writeU32(ch, 24, data.length);
      writeU16(ch, 28, nameBytes.length);
      writeU16(ch, 30, 0);
      writeU16(ch, 32, 0);
      writeU16(ch, 34, 0);
      writeU16(ch, 36, 0);
      writeU32(ch, 38, 0);
      writeU32(ch, 42, offset);
      centralParts.push(centralHeader, nameBytes);

      offset += localHeader.length + nameBytes.length + data.length;
    });

    const centralOffset = offset;
    const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
    const endHeader = new Uint8Array(22);
    const eh = new DataView(endHeader.buffer);
    writeU32(eh, 0, 0x06054b50);
    writeU16(eh, 4, 0);
    writeU16(eh, 6, 0);
    writeU16(eh, 8, files.length);
    writeU16(eh, 10, files.length);
    writeU32(eh, 12, centralSize);
    writeU32(eh, 16, centralOffset);
    writeU16(eh, 20, 0);

    return new Blob([...localParts, ...centralParts, endHeader], { type: "application/zip" });
  }

  function buildProcessRows() {
    return [...project.nodes]
      .sort((a, b) => (Number.isFinite(a.order) ? a.order : 0) - (Number.isFinite(b.order) ? b.order : 0))
      .map((node, index) => {
        const actor = project.actors.find(a => a.id === node.actorId);
        const nextLabels = project.edges
          .filter(edge => edge.from === node.id)
          .map(edge => project.nodes.find(n => n.id === edge.to)?.label || "Missing step")
          .join(" | ");
        return {
          number: index + 1,
          actor: actor?.name || "Unassigned",
          shape: node.type || "process",
          step: node.label || "Untitled step",
          description: node.description || "",
          next: nextLabels
        };
      });
  }

  function csvEscape(value) {
    const text = String(value ?? "");
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  function buildCsv() {
    const rows = buildProcessRows();
    return [
      ["No", "Actor", "Shape", "Step", "Description", "Next Step"].map(csvEscape).join(","),
      ...rows.map(row => [row.number, row.actor, row.shape, row.step, row.description, row.next].map(csvEscape).join(","))
    ].join("\n");
  }

  function docxParagraph(text, style = "") {
    const styleXml = style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : "";
    return `<w:p>${styleXml}<w:r><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`;
  }

  function buildDocxXml(imageCx, imageCy) {
    const rows = buildProcessRows();
    const title = project.title || "System Flowchart";
    const description = project.description || "Generated process flowchart.";
    const paragraphs = [
      docxParagraph(title, "Title"),
      docxParagraph(description),
      docxParagraph("Process steps", "Heading1"),
      ...rows.flatMap(row => [
        docxParagraph(`${row.number}. ${row.actor}: ${row.step}`),
        row.description ? docxParagraph(`Description: ${row.description}`) : "",
        row.next ? docxParagraph(`Next: ${row.next}`) : ""
      ].filter(Boolean)),
      docxParagraph("Flowchart", "Heading1")
    ].join("");

    const drawing = `<w:p><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${imageCx}" cy="${imageCy}"/><wp:docPr id="1" name="SystemFlow Chart"/><wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="1" name="flowchart.png"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rId1"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${imageCx}" cy="${imageCy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`;

    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><w:body>${paragraphs}${drawing}<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720" w:header="360" w:footer="360" w:gutter="0"/></w:sectPr></w:body></w:document>`;
  }

  async function exportDocx() {
    if (!project.nodes.length) return showToast("Generate a chart first.");
    try {
      syncProjectForExport();
      const canvas = await renderChartCanvas("docx");
      const pngBlob = await canvasToBlob(canvas, "image/png");
      const pngBytes = new Uint8Array(await pngBlob.arrayBuffer());
      const maxWidthEmu = Math.round(6.6 * 914400);
      const maxHeightEmu = Math.round(8.7 * 914400);
      const scale = Math.min(maxWidthEmu / canvas.width, maxHeightEmu / canvas.height);
      const cx = Math.round(canvas.width * scale);
      const cy = Math.round(canvas.height * scale);

      const files = [
        { name: "[Content_Types].xml", data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>` },
        { name: "_rels/.rels", data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>` },
        { name: "word/_rels/document.xml.rels", data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/flowchart.png"/></Relationships>` },
        { name: "word/styles.xml", data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:rPr><w:b/><w:sz w:val="32"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:rPr><w:b/><w:sz w:val="24"/></w:rPr></w:style></w:styles>` },
        { name: "word/document.xml", data: buildDocxXml(cx, cy) },
        { name: "word/media/flowchart.png", data: pngBytes }
      ];

      downloadBlob(makeZip(files), safeFilename("docx"));
      showToast("Word DOCX exported.");
    } catch (error) {
      console.error(error);
      showToast("DOCX export failed. Try PNG or SVG export.");
    }
  }

  function createImagePdf(jpegBytes, imageWidth, imageHeight) {
    const margin = 36;
    let pageWidth = 842;
    let pageHeight = 595;
    const landscapeRatio = imageWidth / imageHeight;
    if (landscapeRatio < 1) {
      pageWidth = 595;
      pageHeight = 842;
    }
    const scale = Math.min((pageWidth - margin * 2) / imageWidth, (pageHeight - margin * 2) / imageHeight);
    const drawWidth = imageWidth * scale;
    const drawHeight = imageHeight * scale;
    const x = (pageWidth - drawWidth) / 2;
    const y = (pageHeight - drawHeight) / 2;
    const content = `q\n${drawWidth.toFixed(2)} 0 0 ${drawHeight.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} cm\n/Im0 Do\nQ\n`;

    const objects = [
      `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`,
      `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`,
      `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`,
      { header: `4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${imageWidth} /Height ${imageHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`, data: jpegBytes, footer: `\nendstream\nendobj\n` },
      `5 0 obj\n<< /Length ${textBytes(content).length} >>\nstream\n${content}endstream\nendobj\n`
    ];

    const chunks = [textBytes("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n")];
    const offsets = [];
    let currentOffset = chunks[0].length;

    objects.forEach(obj => {
      offsets.push(currentOffset);
      if (typeof obj === "string") {
        const b = textBytes(obj);
        chunks.push(b);
        currentOffset += b.length;
      } else {
        const header = textBytes(obj.header);
        const footer = textBytes(obj.footer);
        chunks.push(header, obj.data, footer);
        currentOffset += header.length + obj.data.length + footer.length;
      }
    });

    const xrefOffset = currentOffset;
    let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    offsets.forEach(off => { xref += `${String(off).padStart(10, "0")} 00000 n \n`; });
    xref += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
    chunks.push(textBytes(xref));
    return concatBytes(chunks);
  }

  async function exportPdf() {
    if (!project.nodes.length) return showToast("Generate a chart first.");
    try {
      syncProjectForExport();
      const canvas = await renderChartCanvas("pdf");
      const jpegBlob = await canvasToBlob(canvas, "image/jpeg", 0.92);
      const jpegBytes = new Uint8Array(await jpegBlob.arrayBuffer());
      const pdfBytes = createImagePdf(jpegBytes, canvas.width, canvas.height);
      downloadBlob(new Blob([pdfBytes], { type: "application/pdf" }), safeFilename("pdf"));
      showToast("PDF exported.");
    } catch (error) {
      console.error(error);
      showToast("PDF export failed. Try Print Chart.");
    }
  }

  function visioCell(name, value) {
    return `<Cell N="${escapeXml(name)}" V="${escapeXml(value)}"/>`;
  }

  function visioText(value) {
    return escapeXml(String(value || "").replace(/\s+/g, " ").trim());
  }

  function visioShapeGeometry(type, w, h) {
    const ww = Math.max(0.4, w);
    const hh = Math.max(0.25, h);
    if (type === "decision") {
      return `<Section N="Geometry" IX="0"><Row T="MoveTo" IX="1">${visioCell("X", ww / 2)}${visioCell("Y", hh)}</Row><Row T="LineTo" IX="2">${visioCell("X", ww)}${visioCell("Y", hh / 2)}</Row><Row T="LineTo" IX="3">${visioCell("X", ww / 2)}${visioCell("Y", 0)}</Row><Row T="LineTo" IX="4">${visioCell("X", 0)}${visioCell("Y", hh / 2)}</Row><Row T="LineTo" IX="5">${visioCell("X", ww / 2)}${visioCell("Y", hh)}</Row></Section>`;
    }
    if (type === "startOval" || type === "startRound" || type === "endRound" || type === "start") {
      return `<Section N="Geometry" IX="0"><Row T="Ellipse" IX="1">${visioCell("X", ww / 2)}${visioCell("Y", hh / 2)}${visioCell("A", ww / 2)}${visioCell("B", hh / 2)}${visioCell("C", ww / 2)}${visioCell("D", hh)}</Row></Section>`;
    }
    return `<Section N="Geometry" IX="0"><Row T="MoveTo" IX="1">${visioCell("X", 0)}${visioCell("Y", 0)}</Row><Row T="LineTo" IX="2">${visioCell("X", ww)}${visioCell("Y", 0)}</Row><Row T="LineTo" IX="3">${visioCell("X", ww)}${visioCell("Y", hh)}</Row><Row T="LineTo" IX="4">${visioCell("X", 0)}${visioCell("Y", hh)}</Row><Row T="LineTo" IX="5">${visioCell("X", 0)}${visioCell("Y", 0)}</Row></Section>`;
  }

  function buildVsdxPageXml() {
    const L = getLayout();
    const pageWidth = Math.max(8.5, L.width / 96);
    const pageHeight = Math.max(11, L.height / 96);
    const shapeIdMap = new Map();
    let nextShapeId = 1;
    const shapes = [];

    project.actors.forEach((actor, index) => {
      const x = (index * L.laneWidth + L.laneWidth / 2) / 96;
      const y = pageHeight - ((L.titleHeight + L.headerHeight / 2) / 96);
      const w = L.laneWidth / 96;
      const h = L.headerHeight / 96;
      const id = nextShapeId++;
      shapes.push(`<Shape ID="${id}" NameU="Swimlane Header" Type="Shape">${visioCell("PinX", x)}${visioCell("PinY", y)}${visioCell("Width", w)}${visioCell("Height", h)}${visioCell("LocPinX", w / 2)}${visioCell("LocPinY", h / 2)}${visioCell("FillForegnd", "#EAF5EE")}${visioCell("LineColor", "#B7C7BC")}<Text>${visioText(actor.name)}</Text>${visioShapeGeometry("process", w, h)}</Shape>`);
    });

    project.nodes.forEach(node => {
      const pos = L.positions[node.id];
      if (!pos) return;
      const id = nextShapeId++;
      shapeIdMap.set(node.id, id);
      const w = pos.w / 96;
      const h = pos.h / 96;
      const x = pos.x / 96;
      const y = pageHeight - (pos.y / 96);
      const fill = node.type === "decision" ? "#FFF4CC" : node.type === "database" ? "#EAF2FF" : (node.type === "startRound" || node.type === "endRound" || node.type === "start") ? "#000000" : node.type === "startOval" ? "#E8F7EF" : "#FFFFFF";
      const line = node.type === "decision" ? "#B78900" : node.type === "database" ? "#4472C4" : "#2F7D4E";
      shapes.push(`<Shape ID="${id}" NameU="${escapeXml(node.type || "process")}" Type="Shape">${visioCell("PinX", x)}${visioCell("PinY", y)}${visioCell("Width", w)}${visioCell("Height", h)}${visioCell("LocPinX", w / 2)}${visioCell("LocPinY", h / 2)}${visioCell("FillForegnd", fill)}${visioCell("LineColor", line)}<Text>${visioText(node.label)}</Text>${visioShapeGeometry(node.type, w, h)}</Shape>`);
    });

    project.edges.forEach(edge => {
      const source = L.positions[edge.from];
      const target = L.positions[edge.to];
      if (!source || !target) return;
      const id = nextShapeId++;
      const sx = source.x / 96;
      const sy = pageHeight - ((source.y + source.h / 2) / 96);
      const tx = target.x / 96;
      const ty = pageHeight - ((target.y - target.h / 2) / 96);
      const w = Math.max(0.05, Math.abs(tx - sx));
      const h = Math.max(0.05, Math.abs(ty - sy));
      const pinX = (sx + tx) / 2;
      const pinY = (sy + ty) / 2;
      shapes.push(`<Shape ID="${id}" NameU="Connector" Type="Shape">${visioCell("PinX", pinX)}${visioCell("PinY", pinY)}${visioCell("Width", w)}${visioCell("Height", h)}${visioCell("BeginX", sx)}${visioCell("BeginY", sy)}${visioCell("EndX", tx)}${visioCell("EndY", ty)}${visioCell("LineColor", "#A68B19")}${visioCell("EndArrow", "4")}${edge.label ? `<Text>${visioText(edge.label)}</Text>` : ""}<Section N="Geometry" IX="0"><Row T="MoveTo" IX="1">${visioCell("X", 0)}${visioCell("Y", 0)}</Row><Row T="LineTo" IX="2">${visioCell("X", w)}${visioCell("Y", h)}</Row></Section></Shape>`);
    });

    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><PageContents xmlns="http://schemas.microsoft.com/office/visio/2012/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><PageSheet>${visioCell("PageWidth", pageWidth)}${visioCell("PageHeight", pageHeight)}${visioCell("DrawingScale", "1")}${visioCell("PageScale", "1")}</PageSheet><Shapes>${shapes.join("")}</Shapes></PageContents>`;
  }

  function exportVsdx() {
    if (!project.nodes.length) return showToast("Generate a chart first.");
    syncProjectForExport();
    const L = getLayout();
    const pageWidth = Math.max(8.5, L.width / 96);
    const pageHeight = Math.max(11, L.height / 96);
    const files = [
      { name: "[Content_Types].xml", data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/visio/document.xml" ContentType="application/vnd.ms-visio.drawing.main+xml"/><Override PartName="/visio/pages/pages.xml" ContentType="application/vnd.ms-visio.pages+xml"/><Override PartName="/visio/pages/page1.xml" ContentType="application/vnd.ms-visio.page+xml"/></Types>` },
      { name: "_rels/.rels", data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.microsoft.com/visio/2010/relationships/document" Target="visio/document.xml"/></Relationships>` },
      { name: "visio/_rels/document.xml.rels", data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.microsoft.com/visio/2010/relationships/pages" Target="pages/pages.xml"/></Relationships>` },
      { name: "visio/pages/_rels/pages.xml.rels", data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.microsoft.com/visio/2010/relationships/page" Target="page1.xml"/></Relationships>` },
      { name: "visio/document.xml", data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><VisioDocument xmlns="http://schemas.microsoft.com/office/visio/2012/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><DocumentSettings/><DocumentSheet/><Pages><Page ID="0" NameU="Page-1" Name="Page-1" ViewScale="1" ViewCenterX="${pageWidth / 2}" ViewCenterY="${pageHeight / 2}"><Rel r:id="rId1"/></Page></Pages></VisioDocument>` },
      { name: "visio/pages/pages.xml", data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Pages xmlns="http://schemas.microsoft.com/office/visio/2012/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><Page ID="0" NameU="Page-1" Name="Page-1"><Rel r:id="rId1"/></Page></Pages>` },
      { name: "visio/pages/page1.xml", data: buildVsdxPageXml() }
    ];
    downloadBlob(makeZip(files), safeFilename("vsdx"));
    showToast("Visio VSDX exported.");
  }

  function setZoom(value) {
    zoom = Math.max(.35, Math.min(2.2, value));
    els.svgWrap.style.transform = `scale(${zoom})`;
    els.zoomLabel.textContent = `${Math.round(zoom * 100)}%`;
  }

  function fitChart() {
    if (!project.nodes.length) return;
    const L = getLayout();
    const availableW = els.chartStage.clientWidth - 50;
    const availableH = els.chartStage.clientHeight - 50;
    setZoom(Math.min(1, availableW / L.width, availableH / L.height));
    els.chartStage.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }


  // Events
  $$(".tab-btn").forEach(btn => btn.addEventListener("click", () => switchTab(btn.dataset.tab)));
  els.detailForm.addEventListener("submit", e => { e.preventDefault(); saveDetailForm(); });
  $("#deleteDetailBtn").addEventListener("click", deleteDetailNode);
  $("#cancelDetailBtn").addEventListener("click", () => els.detailDialog.close());
  els.projectTitle.addEventListener("input", e => { project.title = e.target.value; markUpdated(); renderChart(); });
  els.projectDescription.addEventListener("input", e => { project.description = e.target.value; markUpdated(); renderChart(); });
  els.requirementsText.addEventListener("input", e => { project.requirements = e.target.value; markUpdated(); });

  els.actorForm.addEventListener("submit", e => {
    e.preventDefault();
    const name = els.actorName.value.trim();
    if (!name) return;
    project.actors.push({ id: uid("actor"), name: name.toUpperCase(), type: els.actorType.value });
    els.actorForm.reset(); markUpdated(); renderAll();
  });

  els.actorList.addEventListener("click", e => {
    const btn = e.target.closest("[data-action]"); if (!btn) return;
    const index = project.actors.findIndex(a => a.id === btn.dataset.id); if (index < 0) return;
    if (btn.dataset.action === "actor-delete") {
      if (project.nodes.some(n => n.actorId === btn.dataset.id)) return showToast("This actor is used by one or more flowchart steps. Reassign them before deleting.");
      project.actors.splice(index, 1);
    }
    if (btn.dataset.action === "actor-up" && index > 0) [project.actors[index - 1], project.actors[index]] = [project.actors[index], project.actors[index - 1]];
    if (btn.dataset.action === "actor-down" && index < project.actors.length - 1) [project.actors[index + 1], project.actors[index]] = [project.actors[index], project.actors[index + 1]];
    markUpdated(); renderAll();
  });

  els.nodeForm.addEventListener("submit", e => {
    e.preventDefault();
    if (!project.actors.length) return showToast("Add an actor first.");
    const id = els.nodeId.value || uid("node");
    const existing = project.nodes.find(n => n.id === id);
    const data = {
      id, label: els.nodeLabel.value.trim(), actorId: els.nodeActor.value, type: els.nodeType.value,
      description: els.nodeDescription.value.trim(),
      order: existing?.order ?? project.nodes.length, manualY: existing?.manualY ?? null
    };
    const index = project.nodes.findIndex(n => n.id === id);
    if (index >= 0) project.nodes[index] = data; else project.nodes.push(data);
    resetNodeForm(); markUpdated(); renderAll();
  });
  $("#resetNodeBtn").addEventListener("click", resetNodeForm);

  els.edgeForm.addEventListener("submit", e => {
    e.preventDefault();
    if (!els.edgeFrom.value || !els.edgeTo.value) return showToast("Select two nodes.");
    if (els.edgeFrom.value === els.edgeTo.value) return showToast("A node cannot connect to itself.");
    project.edges.push({ id: uid("edge"), from: els.edgeFrom.value, to: els.edgeTo.value, label: els.edgeLabel.value.trim() });
    els.edgeLabel.value = ""; markUpdated(); renderAll();
  });

  els.nodeList.addEventListener("click", e => {
    const btn = e.target.closest("[data-action]"); if (!btn) return;
    const node = project.nodes.find(n => n.id === btn.dataset.id); if (!node) return;
    if (btn.dataset.action === "node-edit") {
      els.nodeId.value = node.id; els.nodeLabel.value = node.label; els.nodeActor.value = node.actorId; els.nodeType.value = node.type; els.nodeDescription.value = node.description || "";
    }
    if (btn.dataset.action === "node-delete") {
      project.nodes = project.nodes.filter(n => n.id !== node.id); project.edges = project.edges.filter(edge => edge.from !== node.id && edge.to !== node.id); markUpdated(); renderAll();
    }
  });

  els.edgeList.addEventListener("click", e => {
    const btn = e.target.closest("[data-action='edge-delete']"); if (!btn) return;
    project.edges = project.edges.filter(edge => edge.id !== btn.dataset.id); markUpdated(); renderAll();
  });

  $("#analyzeRequirementsBtn").addEventListener("click", analyzeRequirements);
  $("#clearRequirementsBtn").addEventListener("click", () => { els.requirementsText.value = ""; project.requirements = ""; markUpdated(); });
  $("#autoLayoutBtn").addEventListener("click", autoLayout);
  $("#clearFlowBtn").addEventListener("click", () => { if (confirm("Delete all nodes and connections?")) { project.nodes = []; project.edges = []; markUpdated(); renderAll(); } });
  $("#generateBtn").addEventListener("click", () => { renderChart(); fitChart(); showToast("Chart regenerated."); });

  $("#newProjectBtn").addEventListener("click", () => {
    if (!confirm("Create a new project? Unsaved work will be lost.")) return;
    project = createBlankProject(); resetNodeForm(); renderAll(); setZoom(1); setStatus("New project", "ok");
  });
  const loadSample = () => { project = createMarketSample(); resetNodeForm(); renderAll(); setZoom(.75); setStatus("Market sample loaded", "ok"); showToast("Market Stall System sample loaded."); };
  $("#loadSampleBtn").addEventListener("click", loadSample);
  $("#emptyLoadSampleBtn").addEventListener("click", loadSample);
  $("#saveBrowserBtn").addEventListener("click", saveBrowser);
  $("#exportPngBtn").addEventListener("click", exportPng);
  $("#exportSvgBtn").addEventListener("click", exportSvg);
  $("#importSvgBtn").addEventListener("click", () => els.importSvgFile.click());
  els.importSvgFile.addEventListener("change", () => importEditableSvg(els.importSvgFile.files?.[0]));
  $("#exportPdfBtn").addEventListener("click", exportPdf);
  $("#printBtn").addEventListener("click", () => window.print());

  $("#zoomInBtn").addEventListener("click", () => setZoom(zoom + .1));
  $("#zoomOutBtn").addEventListener("click", () => setZoom(zoom - .1));
  $("#fitBtn").addEventListener("click", fitChart);
  $("#toggleGridBtn").addEventListener("click", () => els.chartStage.classList.toggle("grid-on"));
  $("#closeDialogBtn").addEventListener("click", () => els.detailDialog.close());
  els.detailDialog.addEventListener("click", e => { if (e.target === els.detailDialog) els.detailDialog.close(); });

  window.addEventListener("beforeunload", () => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(project)); } catch { /* ignore quota errors */ }
  });

  if (!loadBrowser()) renderAll();
  setZoom(1);
})();
