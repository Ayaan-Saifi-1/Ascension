export const contextGroups = [
 {title:'Operational context',fields:[
 ['domain','Operational domain',['UNKNOWN','Well Operations','Process / Production','Pipeline / Transport','Occupational']],
 ['site_id','Site reference'],['asset_id','Asset reference'],['equipment_refs','Equipment references'],['well_id','Well reference'],
 ['pipeline_section','Pipeline section'],['work_order','Job / work order'],['event_id','Related event ID'],['location','Exact location'],
 ['shift','Shift',['UNKNOWN','Day','Night','Extended hours']],['workforce','Workforce',['UNKNOWN','Employee','Contractor','Mixed']]]},
 {title:'Reported safety facts',fields:[
 ['reported_activity','Activity'],['reported_hazard','Hazard / energy'],['reported_threat','Threat / release mechanism'],
 ['reported_exposure','Exposure pathway'],['reported_consequence','Credible potential consequence'],
 ['actual_consequence','Actual outcome'],['barrier_name','Critical barrier'],['barrier_state','Barrier state',['UNKNOWN','UNVERIFIED','EFFECTIVE','DEGRADED','FAILED','BYPASSED','ABSENT']],
 ['barrier_evidence','Barrier condition evidence'],['verification_status','Control presence',['UNKNOWN','UNVERIFIED','PRESENT','ABSENT']],
 ['validation_status','Control effectiveness',['UNKNOWN','NOT_VALIDATED','VALIDATED']]]},
 {title:'Measurements and exposure',fields:[
 ['pressure','Pressure and unit'],['gas_concentration','Gas concentration and unit'],['height','Height and unit'],
 ['distance','Distance and unit'],['temperature','Temperature and unit'],['voltage','Voltage and unit'],
 ['mass','Load mass and unit'],['velocity','Speed and unit'],['inventory','Process inventory and unit'],
 ['sidpp','SIDPP and unit'],['pit_gain','Pit gain and unit'],['flow_change','Flow change'],
 ['mud_barrier_status','Mud / well barrier status'],['exposure_denominator','Exposure count and basis (lifts / hours / km)']]},
 {title:'Task and organisational context',fields:[
 ['task_training','Task training',['UNKNOWN','Valid','Expired','Not required']],
 ['authorization_scope','Certification / authorisation scope'],['authorization_validity','Authorisation validity'],
 ['task_familiarity','Task familiarity',['UNKNOWN','First time','Changed task','Recently performed']],
 ['equipment_familiarity','Equipment / site familiarity'],['supervision','Supervision'],
 ['pre_job_plan','Pre-job briefing / JSA'],['fatigue','Fatigue / extended hours'],
 ['change_from_plan','Change from plan'],['stop_work','Stop-work execution'],['handover','Handover'],
 ['productivity_pressure','Productivity pressure'],['procedure_quality','Procedure quality'],['staffing','Staffing context']]}
] as const;

export type SourceFormField = {
  key: string;
  label: string;
  kind?: 'text' | 'date' | 'textarea' | 'select' | 'multi';
  options?: readonly string[];
};
export type SourceFormGroup = { title: string; fields: SourceFormField[] };

// Field names follow the two example paper forms. Values remain in report.context.
export const nearMissFormGroups: SourceFormGroup[] = [
  { title: 'Priority and people', fields: [
    { key: 'nm_priority', label: 'Appropriate level', kind: 'select', options: ['UNKNOWN', 'RED - Immediate action and report', 'YELLOW - Use caution and report', 'GREEN - Continue and report'] },
    { key: 'nm_installation_manager', label: 'Installation manager' },
    { key: 'nm_reported_by', label: 'Reported by' },
    { key: 'nm_reporter_reg_no', label: 'Reporter registration number' },
    { key: 'nm_seen_by', label: 'Incident seen by / witness' },
    { key: 'nm_witness_reg_no', label: 'Witness registration number' },
    { key: 'nm_victim_name', label: 'Name of victim, if any' },
  ] },
  { title: 'Near-miss location and potential outcome', fields: [
    { key: 'nm_place', label: 'Place where the near miss occurred', kind: 'select', options: ['UNKNOWN', 'Well plant', 'Derrick floor', 'H.S.D. tank', 'Pipe rack', 'Monkey board', 'Cementing unit', 'Pump house', 'Cat walk', 'Welding shop', 'Engine house', 'Mud channel', 'Valve manifold', 'Pressure vessel', 'Storage tank area', 'Tanker loading area', 'Auto/electrical workshop', 'ICE / well logging workshop', 'Producing well area', 'Manifold area', 'Process / CODP area', 'Drenching / formation water disposal pump area', 'Generating shed area', 'Water / C.O. storage tank area', 'Material storage area', 'Power house', 'Electrical substation / power distribution line', 'Pump stations', 'Yards', 'LPG area', 'Other'] },
    { key: 'nm_place_other', label: 'Other place / precise location' },
    { key: 'nm_potential_outcomes', label: 'What could have happened?', kind: 'multi', options: ['Accident (minor / serious / fatal)', 'Fire (major / minor)', 'Electrical shock', 'Vehicle accident', 'Explosion', 'Property loss or equipment damage', 'Environmental pollution'] },
    { key: 'nm_potential_other', label: 'Other potential outcome' },
    { key: 'nm_reason_categories', label: 'Reason for occurrence', kind: 'multi', options: ['Struck by moving or falling object', 'Caught in metallic strip or moving chain', 'Caught between moving parts', 'Slip on ground, stairs, ladder or derrick floor', 'Fall below', 'Fall on same level', 'Collapse of wall, ladder or overhead structure', 'Overexertion while lifting, pushing or pulling'] },
    { key: 'nm_reason_other', label: 'Other reason / details' },
  ] },
  { title: 'Evidence and corrective measures', fields: [
    { key: 'nm_pictures_taken', label: 'Were pictures taken?', kind: 'select', options: ['UNKNOWN', 'Yes', 'No'] },
    { key: 'nm_picture_reference', label: 'Picture reference, if available' },
    { key: 'nm_long_term_measure', label: 'Long-term corrective measure', kind: 'textarea' },
    { key: 'nm_reporter_signoff', label: 'Reporter sign-off on source form', kind: 'select', options: ['UNKNOWN', 'Signed', 'Pending'] },
    { key: 'nm_manager_signoff', label: 'Manager sign-off on source form', kind: 'select', options: ['UNKNOWN', 'Signed', 'Pending'] },
  ] },
];

export const accidentFormGroups: SourceFormGroup[] = [
  { title: 'Injured person and accident location', fields: [
    { key: 'acc_injured_name', label: '1.a Name of injured person' },
    { key: 'acc_injured_code', label: '1.b Employee / registration number' },
    { key: 'acc_work_area', label: '3.1 Accident place (work area)' },
    { key: 'acc_exact_location', label: '3.2 Exact location' },
    { key: 'acc_mine', label: '4 Mine / installation, if applicable' },
    { key: 'acc_injury_nature', label: '5 Nature and extent of injury', kind: 'textarea' },
    { key: 'acc_cause', label: '7 Cause of accident', kind: 'textarea' },
  ] },
  { title: 'Experience, responsibility and prevention', fields: [
    { key: 'acc_date_of_birth', label: '8 Date of birth', kind: 'date' },
    { key: 'acc_work_experience', label: '9 Work experience' },
    { key: 'acc_responsible_person', label: '10 Person / factor responsible, if established' },
    { key: 'acc_witness', label: '11 Name of witness' },
    { key: 'acc_person_in_charge', label: '12 Person in direct charge' },
    { key: 'acc_prevention', label: '13 How a similar accident can be prevented', kind: 'textarea' },
  ] },
  { title: 'Sign-off and medical classification', fields: [
    { key: 'acc_contractor_name', label: 'Contractor name' },
    { key: 'acc_contractor_signature', label: 'Contractor signature' },
    { key: 'acc_contractor_date', label: 'Contractor sign-off date', kind: 'date' },
    { key: 'acc_installation_manager', label: 'Installation manager name' },
    { key: 'acc_installation_manager_signature', label: 'Installation manager signature' },
    { key: 'acc_installation_manager_date', label: 'Installation manager sign-off date', kind: 'date' },
    { key: 'acc_department_head', label: 'Department head name' },
    { key: 'acc_department_head_signature', label: 'Department head signature' },
    { key: 'acc_department_head_date', label: 'Department head sign-off date', kind: 'date' },
    { key: 'acc_medical_classification', label: 'Medical classification', kind: 'select', options: ['UNKNOWN', 'Minor reportable', 'Serious', 'Fatal', 'First aid only', 'Pending medical assessment'] },
    { key: 'acc_attending_doctor', label: 'Attending doctor, if recorded' },
    { key: 'acc_attending_doctor_signature', label: 'Attending doctor signature' },
    { key: 'acc_medical_date', label: 'Medical assessment date', kind: 'date' },
    { key: 'acc_signed_copy', label: 'Signed source form available?', kind: 'select', options: ['UNKNOWN', 'Yes', 'No'] },
  ] },
];