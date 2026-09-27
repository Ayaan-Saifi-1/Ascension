import io
from datetime import datetime
from pathlib import Path
from xml.sax.saxutils import escape
from zoneinfo import ZoneInfo

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image, HRFlowable

NAVY = colors.HexColor('#183048')
BLUE = colors.HexColor('#2d6f96')
LINE = colors.HexColor('#bcc8d2')
PALE = colors.HexColor('#eaf2f7')
LOGO = Path(__file__).resolve().parent / 'assets' / 'ascension-logo.png'
SOURCE_LABELS = {
    'nm_priority': 'Appropriate level', 'nm_installation_manager': 'Installation manager',
    'nm_reported_by': 'Reported by', 'nm_reporter_reg_no': 'Reporter registration no.',
    'nm_seen_by': 'Incident seen by', 'nm_witness_reg_no': 'Witness registration no.',
    'nm_victim_name': 'Name of victim', 'nm_place': 'Place of near miss',
    'nm_place_other': 'Other place', 'nm_potential_outcomes': 'What could have happened',
    'nm_potential_other': 'Other potential outcome', 'nm_reason_categories': 'Reason for occurrence',
    'nm_reason_other': 'Other reason', 'nm_pictures_taken': 'Were pictures taken',
    'nm_picture_reference': 'Picture reference', 'nm_long_term_measure': 'Long-term corrective measure',
    'nm_reporter_signoff': 'Reporter sign-off', 'nm_manager_signoff': 'Manager sign-off',
    'acc_injured_name': 'Name of injured person', 'acc_injured_code': 'Employee / registration no.',
    'acc_work_area': 'Accident place / work area', 'acc_exact_location': 'Exact location',
    'acc_mine': 'Mine / installation', 'acc_injury_nature': 'Nature and extent of injury',
    'acc_cause': 'Cause of accident', 'acc_date_of_birth': 'Date of birth',
    'acc_work_experience': 'Work experience', 'acc_responsible_person': 'Responsible person / factor',
    'acc_witness': 'Witness', 'acc_person_in_charge': 'Person in direct charge',
    'acc_prevention': 'How a similar accident can be prevented',
    'reported_activity': 'Reported activity', 'reported_hazard': 'Reported hazard / energy',
    'reported_threat': 'Reported threat / release mechanism',
    'reported_exposure': 'Reported exposure pathway',
    'reported_consequence': 'Reported potential consequence', 'actual_consequence': 'Actual outcome',
    'barrier_name': 'Reported critical barrier', 'barrier_state': 'Reported barrier state',
    'barrier_evidence': 'Reported barrier evidence', 'verification_status': 'Control presence',
    'validation_status': 'Control effectiveness',
}


def label(key):
    return SOURCE_LABELS.get(key, key.removeprefix('nm_').removeprefix('acc_').replace('_', ' ').capitalize())


def value_text(value):
    if value is None or value == '':
        return 'Not recorded'
    if isinstance(value, bool):
        return 'Yes' if value else 'No'
    if isinstance(value, list):
        return ', '.join(value_text(item) for item in value) if value else 'None recorded'
    if isinstance(value, dict):
        return '; '.join(f'{label(k)}: {value_text(v)}' for k, v in value.items())
    return str(value).replace('|', ', ')


def local_time(value):
    if not value:
        return 'Not recorded'
    try:
        return datetime.fromisoformat(str(value).replace('Z', '+00:00')).astimezone(
            ZoneInfo('Asia/Kolkata')).strftime('%d %b %Y, %H:%M IST')
    except (ValueError, TypeError):
        return str(value)


def generate_report_pdf(data, image_records=()):
    output = io.BytesIO()
    doc = SimpleDocTemplate(output, pagesize=(210*mm, 297*mm), leftMargin=19*mm,
        rightMargin=19*mm, topMargin=56*mm, bottomMargin=24*mm,
        title=f"Ascension safety report {data.get('report_id', '')}")
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name='DocTitle', parent=styles['Title'], fontName='Helvetica-Bold',
        fontSize=15, leading=19, textColor=NAVY, spaceAfter=3, alignment=TA_LEFT))
    styles.add(ParagraphStyle(name='SubTitle', parent=styles['Normal'], fontSize=8.5,
        leading=12, textColor=BLUE, spaceAfter=11, alignment=TA_LEFT))
    styles.add(ParagraphStyle(name='Section', parent=styles['Heading2'], fontName='Helvetica-Bold',
        fontSize=11, leading=15, textColor=BLUE, spaceBefore=12, spaceAfter=5, keepWithNext=True))
    styles.add(ParagraphStyle(name='Body', parent=styles['Normal'], fontSize=9, leading=13,
        spaceAfter=5, wordWrap='CJK'))
    styles.add(ParagraphStyle(name='Cell', parent=styles['Body'], fontSize=8.5, leading=12,
        spaceAfter=0))
    styles.add(ParagraphStyle(name='CellBold', parent=styles['Cell'], fontName='Helvetica-Bold', textColor=BLUE))
    styles.add(ParagraphStyle(name='CellWhite', parent=styles['Cell'], fontName='Helvetica-Bold', textColor=colors.white))
    styles.add(ParagraphStyle(name='Note', parent=styles['Body'], fontSize=7.5, leading=10,
        textColor=colors.HexColor('#4d5b67')))
    story = []
    def p(value, style='Body'):
        return Paragraph(escape(value_text(value)).replace('\n', '<br/>'), styles[style])
    def section(title):
        story.append(p(title, 'Section'))
        rule = HRFlowable(width='100%', thickness=.7, color=BLUE, spaceAfter=6)
        rule.keepWithNext = True
        story.append(rule)
    def table(items, widths=(53*mm, 119*mm)):
        if not items:
            story.append(p('None recorded.'))
            return
        cells = [[p(label(key), 'CellBold'), p(value, 'Cell')] for key, value in items]
        t = Table(cells, colWidths=list(widths), hAlign='LEFT')
        t.setStyle(TableStyle([
            ('VALIGN',(0,0),(-1,-1),'TOP'),
            ('LINEBELOW',(0,0),(-1,-1),.35,LINE),
            ('LEFTPADDING',(0,0),(-1,-1),3), ('RIGHTPADDING',(0,0),(-1,-1),7),
            ('TOPPADDING',(0,0),(-1,-1),5), ('BOTTOMPADDING',(0,0),(-1,-1),5),
        ]))
        story.append(t)
    def columns(items, accent=False):
        count = len(items)
        cells = [[p(k, 'CellWhite' if accent else 'CellBold') for k,_ in items],
                 [p(v, 'Cell') for _,v in items]]
        t = Table(cells, colWidths=[172*mm/count]*count)
        rules = [
            ('VALIGN',(0,0),(-1,-1),'TOP'),
            ('LINEBEFORE',(1,0),(-1,-1),.55,LINE),
            ('LINEBELOW',(0,-1),(-1,-1),.7,BLUE),
            ('TOPPADDING',(0,0),(-1,-1),6),
            ('BOTTOMPADDING',(0,0),(-1,-1),6),
            ('LEFTPADDING',(0,0),(-1,-1),7),
            ('RIGHTPADDING',(0,0),(-1,-1),7),
        ]
        if accent:
            rules.append(('BACKGROUND',(0,0),(-1,0),BLUE))
        t.setStyle(TableStyle(rules))
        story.append(t)
    def source_section(title, keys, context):
        pairs = [(key, context[key]) for key in keys if context.get(key) not in (None, '', 'UNKNOWN')]
        if pairs:
            section(title)
            table(pairs)
    context = data.get('context') or {}
    source_form = str(context.get('source_form') or '').upper()
    if not source_form:
        source_form = 'ACCIDENT' if any(key.startswith('acc_') for key in context) else 'NEAR_MISS' if any(key.startswith('nm_') for key in context) else 'GENERAL'
    story.append(p('FULL REPORT & DETAILED ANALYSIS', 'DocTitle'))
    if data.get('is_synthetic'):
        story.append(p('Fictional demonstration record', 'Note'))
    section('Submitted report')
    table([('Report ID',data.get('report_id')),('Report type',data.get('report_type')),
        ('Site / installation',data.get('site')),('Department',data.get('department')),
        ('Event date and time (IST)',local_time(data.get('event_timestamp'))),
        ('Source system',data.get('source_system')),('Source record ID',data.get('source_record_id')),
        ('Record received',local_time(data.get('ingested_at'))),
        ('Schema version',data.get('schema_version')),('Source hash',data.get('source_hash'))])
    section('Description of occurrence' if source_form == 'NEAR_MISS' else
        'Brief description of accident' if source_form == 'ACCIDENT' else 'Description')
    story.append(p(data.get('description')))
    if data.get('immediate_action'):
        section('Immediate action recorded')
        story.append(p(data.get('immediate_action')))
    if image_records:
        section('Attached pictures')
        for image in image_records:
            story.append(p(image.original_name,'CellBold'))
            try:
                image.file.open('rb')
                picture = Image(image.file, width=120*mm, height=80*mm, kind='proportional')
                picture.hAlign = 'LEFT'
                story.append(picture)
            except Exception:
                story.append(p('Image preview unavailable.'))
            finally:
                image.file.close()

    if source_form == 'NEAR_MISS':
        form_groups = [
            ('Priority and people',['nm_priority','nm_installation_manager','nm_reported_by','nm_reporter_reg_no',
                'nm_seen_by','nm_witness_reg_no','nm_victim_name']),
            ('Near-miss location and potential outcome',['nm_place','nm_place_other','nm_potential_outcomes',
                'nm_potential_other','nm_reason_categories','nm_reason_other']),
            ('Evidence and corrective measures',['nm_pictures_taken','nm_picture_reference',
                'nm_long_term_measure','nm_reporter_signoff','nm_manager_signoff']),
        ]
    elif source_form == 'ACCIDENT':
        form_groups = [
            ('Injured person and accident location',['acc_injured_name','acc_injured_code','acc_work_area',
                'acc_exact_location','acc_mine','acc_injury_nature','acc_cause']),
            ('Experience, responsibility and prevention',['acc_date_of_birth','acc_work_experience',
                'acc_responsible_person','acc_witness','acc_person_in_charge','acc_prevention']),
            ('Sign-off and medical classification',[key for key in context if key.startswith('acc_') and key not in {
                'acc_injured_name','acc_injured_code','acc_work_area','acc_exact_location','acc_mine',
                'acc_injury_nature','acc_cause','acc_date_of_birth','acc_work_experience',
                'acc_responsible_person','acc_witness','acc_person_in_charge','acc_prevention'}]),
        ]
    else:
        form_groups = []
    context_groups = [
        ('Operational context',['domain','site_id','asset_id','equipment_refs','well_id','pipeline_section',
            'work_order','event_id','location','shift','workforce']),
        ('Reported safety facts',['reported_activity','reported_hazard','reported_threat','reported_exposure',
            'reported_consequence','actual_consequence','barrier_name','barrier_state','barrier_evidence',
            'verification_status','validation_status']),
        ('Measurements and exposure',['pressure','gas_concentration','height','distance','temperature',
            'voltage','mass','velocity','inventory','sidpp','pit_gain','flow_change','mud_barrier_status',
            'exposure_denominator']),
        ('Task and organisational context',['task_training','authorization_scope','authorization_validity',
            'task_familiarity','equipment_familiarity','supervision','pre_job_plan','fatigue',
            'change_from_plan','stop_work','handover','productivity_pressure','procedure_quality','staffing']),
    ]
    for title, keys in form_groups + context_groups:
        source_section(title, keys, context)
    known = {'source_form'} | {key for _, keys in form_groups + context_groups for key in keys}
    other = [(key,value) for key,value in context.items() if key not in known and value not in (None,'','UNKNOWN')]
    if other:
        section('Other submitted fields')
        table(other)
    story.append(PageBreak())

    story.append(p('DETAILED ANALYSIS', 'DocTitle'))
    section('Assessment')
    classification = {'SIF_POTENTIAL':'SIF potential', 'NON_SIF_POTENTIAL':'Non-SIF potential',
        'REVIEW_REQUIRED':'SIF status undetermined', 'OUT_OF_SCOPE':'Out of scope'}.get(
        data.get('sif_label'), value_text(data.get('sif_label')))
    columns([('SIF potential', classification), ('Priority', data.get('priority'))], accent=True)
    section('Life-Saving Rules')
    story.append(p(data.get('iogp_rules') or 'No Life-Saving Rule mapped from the available details.'))
    section('Precursor information')
    table([('Activity',data.get('activity') or 'Not identified'),
        ('Hazard',data.get('hazards') or 'Not identified'),
        ('Recurring pattern',f"{data.get('pattern_id')} - {data.get('similar_report_count',0)} related reports" if data.get('pattern_id') else 'No recurring pattern linked yet'),
        ('Sites affected',data.get('sites_affected'))])
    estimate = ('Rule screened' if data.get('decision_source') == 'DEMO_LOW_ENERGY_RULE' else
        f"{float(data['sif_probability'])*100:.1f}%" if data.get('sif_probability') is not None else 'Unavailable')
    section('Model status')
    columns([('Text encoder',data.get('encoder_status')),('SIF classifier',data.get('classifier_status')),
        ('SIF model estimate',estimate)])
    if data.get('triage_route') == 'AUTO_OUT_OF_SCOPE':
        section('Automatically screened out')
        story.append(p('This text describes a training example or a drill with no reported actual event. It is excluded from SIF trend counts and needs no classification review.'))
    if data.get('triage_route') == 'AUTO_SIF_ALERT':
        section('Automatic SIF alert')
        story.append(p('Flagged immediately without a classification review step. This is a provisional warning for safety follow-up, not a confirmed incident finding.'))
    if data.get('status') == 'ANALYSIS_UNAVAILABLE':
        section('Human review required')
        story.append(p('Model inference is unavailable. Safety rules remain active and this report is retained for review.'))
    if (data.get('hard_gate') or {}).get('triggered'):
        section('Hard safety gate triggered')
        story.append(p(' + '.join((data.get('hard_gate') or {}).get('reason') or [])))
        story.append(p('Mandatory HSSE review','CellBold'))
    section('Extracted safety facts')
    story.append(p('Source narrative: ' + value_text(data.get('description'))))
    spans = data.get('evidence_spans') or []
    if spans:
        story.append(p('Highlighted narrative evidence: ' + '; '.join(
            f"{item.get('label','Evidence')}: {item.get('text','')}" for item in spans),'Note'))
    exposure = ('No actual exposure identified - simulation' if data.get('simulated') else
        'Report explicitly states no exposure' if data.get('exposure_status') == 'EXPLICITLY_NEGATED' else
        data.get('exposures'))
    table([('Activity',data.get('activity')),('Equipment',data.get('equipment')),
        ('Hazard / energy',data.get('hazards')),('Exposure',exposure),
        ('Potential consequence',data.get('potential_consequences'))])
    story.append(p('Consequences are inferred safety pathways. Highlighted spans reproduce the submitted narrative.','Note'))
    section('Critical barriers')
    barriers = data.get('barriers') or []
    if barriers:
        for barrier in barriers:
            table([('Barrier',barrier.get('name')),('State',barrier.get('state')),
                ('Threat',barrier.get('threat')),('Presence',barrier.get('verification_status')),
                ('Effectiveness',barrier.get('validation_status')),('Evidence',barrier.get('evidence')),
                ('Evidence status','Inferred weakness' if barrier.get('inferred') else 'Reported')])
            if barrier.get('contradictory'):
                story.append(p('Conflicting evidence - clarification required.','Note'))
    else:
        story.append(p('No critical barrier identified. HSSE clarification required.'))
    if data.get('missing_information'):
        section('Information needed')
        story.append(p(data.get('missing_information')))
    if data.get('pattern_id'):
        section('Related reports')
        story.append(p(f"{data.get('similar_report_count',0)} related reports; "
            f"{data.get('pattern_id')} - {len(data.get('sites_affected') or [])} sites - Curated precursor family"))
    story.append(Spacer(1,8))
    story.append(p(f"Model: {value_text(data.get('model_version'))} | "
        f"Catalogue: {value_text(data.get('catalogue_version'))} | "
        f"{local_time(data.get('analysis_timestamp'))}",'Note'))

    def frame(canvas, document):
        canvas.saveState()
        width,height = document.pagesize
        canvas.setStrokeColor(LINE)
        canvas.setLineWidth(.65)
        canvas.rect(12*mm, 12*mm, width-24*mm, height-24*mm)
        canvas.setFillColor(NAVY)
        canvas.rect(19*mm, height-46*mm, 42*mm, 29*mm, stroke=0, fill=1)
        if LOGO.exists():
            canvas.drawImage(str(LOGO), 24*mm, height-43*mm, width=32*mm, height=23*mm,
                preserveAspectRatio=True, anchor='c', mask='auto')
        canvas.setFillColor(NAVY)
        canvas.setFont('Helvetica-Bold', 17)
        canvas.drawString(69*mm, height-27*mm, 'SAFETY REPORT')
        canvas.setFont('Helvetica', 8)
        canvas.setFillColor(BLUE)
        canvas.drawString(69*mm, height-34*mm, 'ASCENSION  /  SIF PRECURSOR ASSESSMENT')
        canvas.setStrokeColor(NAVY)
        canvas.setLineWidth(1.25)
        canvas.line(19*mm, height-49*mm, width-19*mm, height-49*mm)
        canvas.setStrokeColor(NAVY)
        canvas.setLineWidth(1)
        canvas.line(19*mm, 22*mm, width-19*mm, 22*mm)
        canvas.setFont('Helvetica-Bold', 8)
        canvas.setFillColor(NAVY)
        canvas.drawString(19*mm, 17*mm, 'ASCENSION  |  FINAL REPORT')
        canvas.setFont('Helvetica', 8)
        canvas.drawCentredString(width/2, 17*mm, f"Issued {local_time(data.get('analysis_timestamp'))}")
        canvas.drawRightString(width-19*mm, 17*mm, f'Page {document.page}')
        canvas.restoreState()
    doc.build(story,onFirstPage=frame,onLaterPages=frame)
    output.seek(0)
    return output
