"""Entirely synthetic; no OIL records or real operational statistics."""
from datetime import datetime,timedelta,timezone
SAMPLES=[
 dict(name="Suspended Load",description="Worker was observed standing beneath a suspended pipe while crane lifting activity was underway. No injury occurred.",report_type="Near Miss"),
 dict(name="PSV Bypass",description="During operation the pressure safety valve was found gagged/bypassed. No injury or release was reported.",report_type="Unsafe Condition"),
 dict(name="H2S Mock Drill (screened out)",expected_route="AUTO_OUT_OF_SCOPE",description="H2S emergency mock drill was conducted successfully. The gas detector was tested and found functional. No actual gas release occurred.",report_type="Incident"),
 dict(name="Vague Report",description="Unsafe condition observed near equipment.",report_type="Unsafe Condition"),
 dict(name="Pipeline Excavation",description="Excavation work was observed close to a marked pipeline route. Permit details and underground line verification were not available.",report_type="Unsafe Act"),
 dict(name="Crane pipe on rack (automatic SIF alert)",description="During crane lifting, a steel pipe shifted on the staging rack while the crew prepared the load. No worker entered the lifting zone. The exclusion zone was tested and found functional.",report_type="Near Miss",expected_route="AUTO_SIF_ALERT"),
 dict(name="Dropped shackle (automatic SIF alert)",description="During crane lifting, a steel shackle fell from the rigging into the marked exclusion zone. No workers were inside the zone. The exclusion zone was tested and found functional.",report_type="Near Miss",expected_route="AUTO_SIF_ALERT"),
 dict(name="Vehicle barrier contact (automatic SIF alert)",description="During vehicle movement, a truck contacted a steel barrier beside a pedestrian walkway. No worker entered the vehicle route. The pedestrian barrier was tested and found functional.",report_type="Near Miss",expected_route="AUTO_SIF_ALERT"),
 dict(name="Pump coupling accident (Form-A)",form_kind="accident",description="During pump maintenance, a worker reached beside a rotating shaft while the motor remained energized and lockout was absent. The worker's left hand was caught in the coupling and a fingertip was amputated.",report_type="Incident"),
]
SAMPLE_DETAILS=[
 dict(site="Fictional Duliajan lifting yard",department="Maintenance",event_time="09:15",immediate_action="Lift stopped; the crew moved clear of the suspended-load area. The supervisor was informed and access controls were checked before work resumed.",context=dict(domain="Occupational",site_id="DEMO-DUL-01",asset_id="LIFT-BAY-01",equipment_refs="Mobile crane; suspended steel pipe",location="Pipe handling bay",shift="Day",workforce="Contractor",reported_activity="Mechanical lifting",reported_hazard="Suspended load",reported_threat="Dropped or swinging pipe",reported_exposure="Worker beneath suspended pipe",reported_consequence="Potential fatal struck-by or crushing injury",actual_consequence="No injury reported",barrier_name="Exclusion Zone / Access Control",barrier_state="DEGRADED",barrier_evidence="Worker observed beneath the suspended pipe",verification_status="UNVERIFIED",validation_status="NOT_VALIDATED",stop_work="Lift stopped after observation")),
 dict(site="Fictional Moran process unit",department="Operations",event_time="10:40",immediate_action="Operation was paused and the process supervisor notified. The relief device was referred for inspection before the unit could return to service.",context=dict(domain="Process / Production",site_id="DEMO-MOR-01",asset_id="SEP-01",equipment_refs="Separator; pressure safety valve",location="Separator skid",shift="Day",workforce="Employee",reported_activity="Process operation",reported_hazard="Process overpressure",reported_threat="Relief protection unavailable during demand",reported_consequence="Potential vessel rupture and serious injury",actual_consequence="No release or injury reported",barrier_name="Pressure Safety Valve",barrier_state="BYPASSED",barrier_evidence="Valve found gagged or bypassed during operation",verification_status="PRESENT",validation_status="NOT_VALIDATED",stop_work="Operation paused")),
 dict(site="Fictional Duliajan training area",department="HSE",event_time="11:00",immediate_action="Drill completed; detector test result and participant observations were recorded for the training debrief.",context=dict(domain="Occupational",site_id="DEMO-DUL-TRAIN",asset_id="TRAIN-AREA-01",equipment_refs="Portable H2S gas detector",location="Training ground",shift="Day",workforce="Mixed",reported_activity="Emergency mock drill",reported_hazard="Simulated H2S scenario",reported_threat="Training scenario only; no actual gas release",reported_consequence="No real exposure pathway",actual_consequence="No actual release or injury",barrier_name="Gas Detector",barrier_state="EFFECTIVE",barrier_evidence="Detector function test passed during the drill",verification_status="PRESENT",validation_status="VALIDATED",pre_job_plan="Drill briefing completed")),
 dict(site="Fictional Digboi workshop",department="Maintenance",event_time="14:20",immediate_action="The workshop supervisor was asked to identify the equipment, hazard, exposure and control status before classification.",context=dict(domain="Occupational",site_id="DEMO-DIG-01",location="Workshop area",shift="Day",workforce="Employee",actual_consequence="No injury stated in the report")),
 dict(site="Fictional Naharkatiya pipeline corridor",department="Projects",event_time="08:35",immediate_action="Excavation was held near the marked route. The permit and underground-line verification were requested before restart.",context=dict(domain="Pipeline / Transport",site_id="DEMO-NAH-01",pipeline_section="Demo corridor P-04",equipment_refs="Excavator; marked pipeline route",location="Marked pipeline crossing",shift="Day",workforce="Contractor",reported_activity="Excavation",reported_hazard="Underground pipeline strike",reported_threat="Excavator could contact the buried line",reported_consequence="Potential release and serious injury",actual_consequence="No line strike or injury reported",barrier_name="Permit / Underground Line Verification",barrier_state="UNVERIFIED",barrier_evidence="Permit and line verification were not available in the report",verification_status="UNVERIFIED",validation_status="NOT_VALIDATED",stop_work="Excavation held pending verification")),
 dict(site="Fictional Duliajan pipe staging bay",department="Logistics",event_time="09:50",immediate_action="Pipe movement was paused; the load and rack were inspected while the exclusion zone remained in place.",context=dict(domain="Occupational",site_id="DEMO-DUL-02",asset_id="STAGING-RACK-01",equipment_refs="Crane; steel pipe; staging rack",location="Pipe staging bay",shift="Day",workforce="Mixed",reported_activity="Mechanical lifting",reported_hazard="Suspended load",reported_threat="Pipe shift or dropped load",reported_consequence="Potential struck-by injury if the exclusion zone were breached",actual_consequence="No injury reported",barrier_name="Exclusion Zone / Access Control",barrier_state="EFFECTIVE",barrier_evidence="No worker entered the zone; exclusion control was tested and found functional",verification_status="PRESENT",validation_status="VALIDATED",stop_work="Pipe movement paused for inspection")),
 dict(site="Fictional Moran lifting deck",department="Maintenance",event_time="13:10",immediate_action="The lift was paused; the shackle and rigging were secured and inspected, with the barricade kept in place.",context=dict(domain="Occupational",site_id="DEMO-MOR-02",asset_id="LIFT-DECK-01",equipment_refs="Crane rigging; steel shackle",location="Barricaded lifting deck",shift="Day",workforce="Contractor",reported_activity="Mechanical lifting",reported_hazard="Dropped steel shackle",reported_threat="Object falling from rigging",reported_consequence="Potential struck-by injury if someone entered the zone",actual_consequence="No injury reported",barrier_name="Exclusion Zone / Access Control",barrier_state="EFFECTIVE",barrier_evidence="Area was barricaded and access control was tested; no workers were inside",verification_status="PRESENT",validation_status="VALIDATED",stop_work="Lift paused for rigging inspection")),
 dict(site="Fictional Digboi logistics yard",department="Transport",event_time="15:25",immediate_action="The truck stopped; the barrier and vehicle route were inspected, and the transport supervisor was informed.",context=dict(domain="Pipeline / Transport",site_id="DEMO-DIG-02",asset_id="YARD-ROUTE-01",equipment_refs="Truck; steel pedestrian barrier",location="Segregated yard vehicle route",shift="Day",workforce="Employee",reported_activity="Vehicle movement",reported_hazard="Moving vehicle",reported_threat="Vehicle could enter the pedestrian walkway",reported_consequence="Potential vehicle-pedestrian collision if separation failed",actual_consequence="No pedestrian injury reported",barrier_name="Vehicle / Pedestrian Separation",barrier_state="EFFECTIVE",barrier_evidence="Barrier checked after contact and found functional; no pedestrian was in the vehicle route",verification_status="PRESENT",validation_status="VALIDATED",stop_work="Truck stopped for inspection")),
 dict(site="Fictional Moran pump house",department="Maintenance",event_time="14:05",immediate_action="Pump power was isolated, the worker received first aid and medical referral, and the maintenance supervisor secured the equipment for investigation.",context=dict(domain="Process / Production",site_id="DEMO-MOR-03",asset_id="PUMP-02",equipment_refs="Pump motor; rotating shaft; coupling",location="Pump house maintenance bay",shift="Day",workforce="Employee",reported_activity="Pump maintenance",reported_hazard="Unexpected energisation and rotating shaft",reported_threat="Unisolated moving coupling",reported_exposure="Worker hand caught in coupling",reported_consequence="Permanent hand injury",actual_consequence="Fingertip amputation",barrier_name="Lockout / Tagout",barrier_state="ABSENT",barrier_evidence="Lockout was absent while the motor remained energized",verification_status="ABSENT",validation_status="NOT_VALIDATED",stop_work="Pump isolated and equipment secured",acc_injured_name="Fictional Worker A",acc_injured_code="DEMO-EMP-014",acc_work_area="Pump maintenance bay",acc_exact_location="Pump house, coupling side of PUMP-02",acc_mine="Not applicable - process unit",acc_injury_nature="Partial fingertip amputation of left hand",acc_cause="Energy isolation was not applied before contact with the coupling; root cause investigation pending",acc_date_of_birth="1992-04-12",acc_work_experience="4 years in pump maintenance",acc_responsible_person="Root cause and responsibility pending investigation",acc_witness="Fictional Worker B",acc_person_in_charge="Fictional Shift Supervisor",acc_prevention="Verify lockout and zero energy before removing guards or reaching into rotating equipment",acc_installation_manager="Fictional Installation Manager",acc_department_head="Fictional Maintenance Head",acc_medical_classification="Serious",acc_attending_doctor="Not recorded in synthetic example",acc_signed_copy="No")),
]

# Curated, entirely fictional intake examples. These names make the expected
# precursor class and source form clear in the sample menu.
for index in (2, 3, 5, 6, 7):
    SAMPLES[index]["show_in_picker"] = False
SAMPLES[0].update(name="Near miss - SIF: suspended pipe", form_kind="near_miss")
SAMPLES[1].update(name="Unsafe condition - SIF: PSV bypass", form_kind="general")
SAMPLES[4].update(name="Unsafe act - SIF: excavation near line", form_kind="general")
SAMPLES[8].update(name="Accident - SIF: rotating coupling", form_kind="accident")
SAMPLES[4]["description"] = (
    "A contractor began excavating beside a marked buried pipeline while the dig permit "
    "and underground-line verification were absent. The excavator operator and banksman "
    "were beside the potential strike zone. Work was stopped before the bucket reached the line."
)

SAMPLES.extend([
    dict(name="Near miss - Non-SIF: light packaging", form_kind="near_miss",
         description="An empty cardboard sleeve slid from a knee-height storeroom shelf and landed on the floor of a closed inventory aisle. Nobody was in the aisle. The sleeve weighed less than 0.2 kg. The shelf was checked and found secure. No injury or damage occurred.",
         report_type="Near Miss"),
    dict(name="Accident - Non-SIF: paper cut", form_kind="accident",
         description="A storekeeper received a superficial paper cut on one finger while opening a cardboard stationery box at a desk. First aid cleaned and dressed the cut. The worker returned to normal duties immediately. No powered equipment was involved.",
         report_type="Incident"),
    dict(name="Unsafe act - Non-SIF: empty carton", form_kind="general",
         description="During routine inventory a clerk briefly placed an empty cardboard carton in a closed storeroom aisle. A supervisor moved it onto a shelf before the aisle reopened. Nobody entered the area and no incident occurred.",
         report_type="Unsafe Act"),
    dict(name="Unsafe condition - Non-SIF: bin lid", form_kind="general",
         description="A small sharp edge was noticed on the lid of an empty plastic stationery bin in a closed storeroom. The bin was removed from use and the lid replaced before anyone handled it. No injury occurred.",
         report_type="Unsafe Condition"),
])
SAMPLE_DETAILS.extend([
    dict(site="Fictional Digboi storeroom", department="Materials", event_time="11:20",
         immediate_action="The aisle remained closed while the empty sleeve was removed and the shelf was checked.",
         context=dict(domain="Occupational", site_id="DEMO-DIG-STORE-01", location="Closed inventory aisle",
             equipment_refs="Empty cardboard sleeve; knee-height shelf", reported_activity="Inventory handling",
             reported_hazard="Lightweight packaging on the floor", reported_exposure="No one in the closed aisle",
             reported_consequence="At most minor contact with a lightweight sleeve",
             actual_consequence="No injury or damage",
             barrier_name="Storeroom access and shelf inspection", barrier_state="EFFECTIVE",
             barrier_evidence="Aisle was closed and the shelf was checked after the sleeve fell",
             verification_status="PRESENT", validation_status="VALIDATED", shift="Day", workforce="Employee",
             nm_priority="GREEN - Continue and report", nm_installation_manager="Fictional Stores Supervisor",
             nm_reported_by="Fictional Safety Officer E", nm_reporter_reg_no="DEMO-HSE-005",
             nm_seen_by="Fictional Storekeeper", nm_witness_reg_no="DEMO-WIT-005",
             nm_place="Other", nm_place_other="Closed inventory aisle", nm_potential_outcomes="Property loss or equipment damage",
             nm_reason_categories="Struck by moving or falling object", nm_pictures_taken="No",
             nm_long_term_measure="Keep light packaging within the shelf edge and inspect shelving during inventory")),
    dict(site="Fictional Duliajan office stores", department="Materials", event_time="10:15",
         immediate_action="The cut was cleaned and dressed with first-aid supplies. The carton edge was discarded.",
         context=dict(domain="Occupational", site_id="DEMO-DUL-STORE-02", location="Office stores desk",
             equipment_refs="Cardboard stationery box; paper packaging", reported_activity="Opening stationery carton",
             reported_hazard="Paper edge on light stationery packaging", reported_exposure="Finger in contact with paper edge",
             reported_consequence="Superficial finger cut requiring first aid only",
             actual_consequence="Superficial paper cut; worker returned to normal duties",
             barrier_name="First-aid and carton-handling control", barrier_state="EFFECTIVE",
             barrier_evidence="Carton was stationary on a desk; first aid was available and the edge was discarded",
             verification_status="PRESENT", validation_status="VALIDATED", shift="Day", workforce="Employee",
             acc_injured_name="Fictional Storekeeper A", acc_injured_code="DEMO-EMP-021",
             acc_work_area="Office stores", acc_exact_location="Stationery issue desk",
             acc_mine="Not applicable - office stores", acc_injury_nature="Superficial paper cut on one finger; first aid only",
             acc_cause="Finger contacted the edge of stationery packaging while opening the box",
             acc_date_of_birth="1997-06-18", acc_work_experience="3 years in materials handling",
             acc_responsible_person="Contact with packaging edge; no individual blame assigned",
             acc_witness="Fictional Storekeeper B", acc_person_in_charge="Fictional Stores Supervisor",
             acc_prevention="Use a letter opener and keep fingers clear of paper edges when opening cartons",
             acc_installation_manager="Fictional Installation Manager", acc_department_head="Fictional Materials Head",
             acc_medical_classification="First aid only", acc_attending_doctor="Not required - first aid only",
             acc_signed_copy="No")),
    dict(site="Fictional Moran storeroom", department="Materials", event_time="09:05",
         immediate_action="The empty carton was moved to the shelf before the closed aisle reopened.",
         context=dict(domain="Occupational", site_id="DEMO-MOR-STORE-03", location="Closed storeroom aisle",
             equipment_refs="Empty cardboard carton", reported_by="Fictional Safety Officer F",
             reported_activity="Routine inventory", reported_hazard="Empty carton temporarily in a closed aisle",
             reported_exposure="No one entered the aisle while the carton was present",
             reported_consequence="At most minor contact with empty cardboard packaging",
             actual_consequence="No injury or damage", barrier_name="Storeroom access and housekeeping control",
             barrier_state="EFFECTIVE", barrier_evidence="Aisle remained closed until the carton was moved",
             verification_status="PRESENT", validation_status="VALIDATED", shift="Day", workforce="Employee",
             supervision="Supervisor present", pre_job_plan="Inventory briefing completed")),
    dict(site="Fictional Naharkatiya storeroom", department="Materials", event_time="13:40",
         immediate_action="The empty plastic bin was removed from use and its lid replaced before handling resumed.",
         context=dict(domain="Occupational", site_id="DEMO-NAH-STORE-04", location="Closed stationery storeroom",
             equipment_refs="Empty plastic stationery bin", reported_by="Fictional Safety Officer G",
             reported_activity="Storeroom inspection", reported_hazard="Minor sharp edge on an empty plastic bin lid",
             reported_exposure="No one handled the bin before it was removed",
             reported_consequence="At most a superficial finger scratch from a light plastic lid",
             actual_consequence="No injury or damage", barrier_name="Storeroom access and damaged-item removal",
             barrier_state="EFFECTIVE", barrier_evidence="Room was closed and the bin was removed before use",
             verification_status="PRESENT", validation_status="VALIDATED", shift="Day", workforce="Employee",
             supervision="Supervisor present", pre_job_plan="Routine inspection checklist completed")),
])

assert len(SAMPLES)==len(SAMPLE_DETAILS)
NEAR_MISS_FORM_DETAILS={
 0: dict(nm_priority="RED - Immediate action and report",nm_installation_manager="Fictional Installation Manager",nm_reported_by="Fictional Safety Officer A",nm_reporter_reg_no="DEMO-HSE-001",nm_seen_by="Fictional Witness A",nm_witness_reg_no="DEMO-WIT-001",nm_place="Pipe rack",nm_potential_outcomes="Accident (minor / serious / fatal)",nm_reason_categories="Struck by moving or falling object",nm_pictures_taken="UNKNOWN",nm_long_term_measure="Review the lifting plan and access-control layout before the next lift"),
 5: dict(nm_priority="YELLOW - Use caution and report",nm_installation_manager="Fictional Installation Manager",nm_reported_by="Fictional Safety Officer B",nm_reporter_reg_no="DEMO-HSE-002",nm_place="Pipe rack",nm_potential_outcomes="Accident (minor / serious / fatal)",nm_reason_categories="Struck by moving or falling object",nm_pictures_taken="UNKNOWN",nm_long_term_measure="Inspect pipe rack supports and confirm the lifting sequence"),
 6: dict(nm_priority="YELLOW - Use caution and report",nm_installation_manager="Fictional Installation Manager",nm_reported_by="Fictional Safety Officer C",nm_reporter_reg_no="DEMO-HSE-003",nm_place="Other",nm_place_other="Barricaded lifting deck",nm_potential_outcomes="Accident (minor / serious / fatal)",nm_reason_categories="Struck by moving or falling object",nm_pictures_taken="UNKNOWN",nm_long_term_measure="Inspect rigging and verify shackle retention before the next lift"),
 7: dict(nm_priority="YELLOW - Use caution and report",nm_installation_manager="Fictional Installation Manager",nm_reported_by="Fictional Safety Officer D",nm_reporter_reg_no="DEMO-HSE-004",nm_place="Other",nm_place_other="Segregated yard vehicle route",nm_potential_outcomes="Vehicle accident",nm_reason_other="Truck contacted pedestrian barrier",nm_pictures_taken="UNKNOWN",nm_long_term_measure="Inspect yard barriers and review vehicle turning clearance"),
}
for sample,details in zip(SAMPLES,SAMPLE_DETAILS):
    sample.update(details)
SAMPLES[1]["context"]["reported_exposure"] = "Operator present beside the live separator"
SAMPLES[4]["context"].update(
    reported_exposure="Excavator operator and banksman beside the potential line-strike zone",
    barrier_state="ABSENT",
    barrier_evidence="No dig permit or underground-line verification was in place at the start of work",
    verification_status="ABSENT",
)
for index,fields in NEAR_MISS_FORM_DETAILS.items():
    SAMPLES[index]["context"].update(fields)
TEMPLATES=[
 SAMPLES[0]["description"],
 "A technician was inside the lifting zone beside a crane and suspended load. Exclusion zone barricade was damaged. No injury was recorded.",
 "A helper entered crane radius during lifting. A suspended pipe was moving. No injury occurred.",
 "A person crossed below the load during crane lifting activity. The exclusion zone was missing.",
 SAMPLES[1]["description"],
 "During process operation the PSV was bypassed on the separator. Personnel were near the vessel.",
 "During operation the pressure relief valve failed on the vessel. No release was recorded.",
 "Maintenance on a pump exposed a rotating shaft. Lockout was absent. No injury occurred.",
 "A technician working on an energized motor found the isolation bypassed during maintenance.",
 "Maintenance on a motor started while LOTO was not verified. No injury was recorded.",
 SAMPLES[4]["description"],
 "Trenching with an excavator was observed close to a buried pipeline. Permit details were not available.",
 "Excavation near a pipeline route continued. Underground line verification was unverified.",
 "Worker welding near a tank with flammable vapour reported. Hot work permit was absent.",
 "Grinding near a tank with flammable gas was observed. Gas test was not available.",
 "Worker on scaffold at a height of 8 m was exposed to an open edge. Guardrail was missing.",
 "Standing on a platform during scaffold work at 5 m. Fall protection was damaged.",
 "Worker exposed to H2S during gas testing. Gas detector failed.",
 "H2S monitoring reported 12 ppm. Gas detector calibration expired.",
 "Worker entered a tank for confined space work. Entry permit was absent. Oxygen deficiency was reported.",
 "Driving a truck, driver speeding with a pedestrian behind. Pedestrian barrier was missing.",
 "Well control during drilling recorded a well kick. BOP was bypassed. Crew on rig were present.",
 SAMPLES[2]["description"],
 "Gas detector installed for H2S monitoring. Detector condition is unknown.",
 SAMPLES[3]["description"],
 "Housekeeping observation reported at the workshop. Waste packaging was moved to a bin.",
 "Emergency drill simulated a confined space rescue. No actual release occurred. Atmosphere test tested successfully.",
]
def demo_reports():
    sites=["Duliajan · Demo","Moran · Demo","Naharkatiya · Demo","Digboi · Demo"]
    now=datetime.now(timezone.utc)
    DEMO_COUNT=200  # increased for richer chart data
    for i in range(DEMO_COUNT):
        index=i%len(TEMPLATES)
        # Wider date distribution up to ~180 days for better temporal spread
        age=(i*13)%180+1 if index>3 else (i*5)%90+1
        yield dict(
            report_id=f"DEMO-{i+1:03}",
            site=sites[(i//3)%len(sites)],
            department="Operations" if i%3 else "Maintenance",
            report_type=["Near Miss","Unsafe Condition","Unsafe Act","Incident"][i%4],
            event_timestamp=(now-timedelta(days=age,hours=i%8)).isoformat(),
            description=TEMPLATES[index],
            immediate_action="Reported to the site HSE team for review.",
            is_synthetic=True,
            source_system="SYNTHETIC_DEMO",
            source_record_id=f"DEMO-{i+1:03}"
        )
