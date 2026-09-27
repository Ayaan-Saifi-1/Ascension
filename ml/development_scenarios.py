"""Fictional paired scenarios for development; never HSE-reviewed field data.

Pair members share a split. Two scenarios per family train, one calibrates,
one selects the candidate, and two are reserved for a final evaluation.
Negative means no uncontrolled precursor described, not certification of safety.
"""

PAIRS = {
    "lifting": [
        ("A steel skid hung from a crane. A rigger stepped beneath it to free a snagged sling while the operator continued slewing.", "The skid was landed on rated supports before a rigger approached to free the sling. The crane was stationary and the skid secured against movement."),
        ("A lifting shackle failed and the pump fell beside a fitter guiding it by hand inside the lifting area.", "A damaged shackle was found before lifting. The job was cancelled, the pump remained on the ground and the shackle was replaced."),
        ("During unloading a pallet slipped out of its sling while a banksman reached below the airborne pallet.", "The pallet stayed on the trailer while the valves were secured. Nobody entered the lifting envelope during the subsequent lift."),
        ("An overhead hoist carried a compressor across an occupied aisle. It passed directly above the workshop crew.", "The aisle was evacuated and physically closed before the overhead hoist moved the compressor. The crew stayed outside the lifting boundary."),
        ("At the laydown yard a crane hook released a pipe rack unexpectedly. A slinger in its landing footprint jumped clear as the rack dropped.", "The pipe rack was secured on the ground before the hook was released. The slinger stayed outside its landing footprint during lowering."),
        ("A three-tonne motor hung on chain blocks. A technician crawled underneath to align its bolts without first supporting the motor.", "The motor was lowered onto engineered stands and secured against movement before the technician reached underneath to align its bolts."),
    ],
    "isolation": [
        ("A fitter put his hand into a conveyor drive to remove debris. The supply was connected and a coworker pressed start.", "The conveyor was disconnected, personally locked and tested for zero energy before the fitter removed debris. A start attempt confirmed it could not run."),
        ("A mechanic loosened a hydraulic fitting with 180 bar trapped behind it. Oil erupted towards his face.", "The hydraulic supply was isolated and trapped pressure drained. Zero pressure was verified on a tested gauge before any fitting was loosened."),
        ("The mixer started rotating while a cleaner's arm was inside. Its isolator had only been switched off and another operator reset it.", "The mixer's supply was locked with the cleaner's padlock. Zero energy and stopped motion were verified before the cleaner entered the drum."),
        ("Stored spring force released when a technician unbolted an actuator. The unrestrained cover shot past his head.", "The actuator spring was discharged and mechanically restrained before any bolts were loosened. The cover remained supported throughout removal."),
        ("A pump restarted remotely with its guard off and the mechanic's fingers between the coupling halves. No personal lock was fitted.", "Remote restart was disabled by a personal electrical lock and a try-start verified isolation. The coupling was secured before its guard was removed."),
        ("A worker cut a cable assumed abandoned. It was energised at 6.6 kV and an arc flash burned his clothing.", "The cable was identified end-to-end, disconnected, earthed and proved dead using an approved tester before the worker cut it."),
    ],
    "confined_space": [
        ("A worker climbed inside a nitrogen-purged tank to retrieve a tool. Oxygen was 9 percent and entry checks had not been made.", "The nitrogen-purged tank was locked closed. The tool was recovered remotely and nobody entered the oxygen-deficient space."),
        ("A cleaner descended into a vessel containing solvent vapour without ventilation or an atmosphere test.", "The vessel was isolated, ventilated and tested within entry limits. A permit, attendant and rescue arrangements were confirmed before the cleaner entered."),
        ("A man entered a ballast compartment without testing its air. He became dizzy in an oxygen-deficient atmosphere and required rescue.", "The ballast compartment stayed closed until isolation, ventilation, air testing, an entry permit and rescue arrangements were confirmed."),
        ("A welder crawled into a process drum with residual vapour. No atmosphere check or attendant was provided.", "The drum was cleaned, isolated and tested with continuous monitoring. The entry permit, ventilation, attendant and rescue plan were in force before entry."),
        ("A fitter entered a disused underground sump. The oxygen monitor later read 11 percent; no attendant knew he was inside.", "Access to the sump was prevented after an 11 percent oxygen reading. A remote camera was used while everyone remained above ground."),
        ("Two workers climbed through a manway to remove sludge while a connected nitrogen line remained open. One lost consciousness.", "The vessel connections were blinded, the atmosphere verified and entry authorised with continuous monitoring and an attendant before sludge removal."),
    ],
    "driving": [
        ("A tanker reversed into a pedestrian crossing without a banksman. A worker was trapped against a pickup until the driver stopped.", "The tanker reversed in a closed vehicle lane under a banksman's direction. Pedestrians stayed behind barriers outside the movement area."),
        ("The pickup driver fell asleep on the highway and crossed into oncoming traffic. His passenger was not wearing a seatbelt.", "The pickup driver stopped at a safe rest area when tired. The journey resumed with a rested driver and all occupants wearing seatbelts."),
        ("A haul truck rolled backwards on a slope while its driver stood between it and a wall. The parking brake failed and there were no chocks.", "The haul truck was parked on level ground with its brake checked and wheels chocked. The driver used a separated walkway."),
        ("A speeding crew bus overtook at a blind bend and narrowly missed a fuel tanker. Several passengers stood in the aisle.", "The crew bus stayed within the speed limit, did not overtake at the blind bend and carried seated passengers with fastened belts."),
        ("A telehandler reversed out of a shed and pinned a worker against a container. Its reverse alarm was inoperative and no spotter was present.", "The telehandler was taken out of service when its reverse alarm failed during inspection. Its keys were secured and vehicle movement stopped."),
        ("During a night journey the driver used a phone, drifted across the centre line and forced an oncoming truck to brake sharply.", "During the night journey the driver parked in a designated lay-by before using his phone. The vehicle stayed stationary until the call finished."),
    ],
    "hot_work": [
        ("A grinder threw sparks into petrol vapour beside a leaking hose. The fitter continued without checking the atmosphere.", "Grinding stopped when a petrol leak was found. The hose was isolated and the area evacuated before any ignition source was allowed back."),
        ("A welder struck an arc on a tank containing flammable residue. There was no cleaning certificate or gas test and vapour ignited.", "The tank was emptied, isolated, cleaned and verified gas-free before welding. A permit, fire watch and continuous monitoring were active."),
        ("A flame heated a flange while hydrocarbon vapour escaped from the adjacent drain. No gas test had been performed.", "The drain was isolated and flange work postponed until gas testing and the permit confirmed a safe atmosphere with monitoring in place."),
        ("Welding continued after the gas monitor alarmed. A hydrocarbon cloud moved through the occupied work area.", "Welding stopped when the gas monitor alarmed. Power was isolated and the crew withdrew before the cloud reached the work area."),
        ("A contractor cut a used fuel drum with an abrasive saw. Residual vapour exploded and its lid flew past another worker's face.", "The used fuel drum was marked for specialist disposal and cutting prohibited. The contractor used a new clean steel sheet in the designated hot-work bay."),
        ("Workers began grinding above an open condensate drain. Sparks reached the drain and a flame flashed towards the occupied platform.", "Before grinding the condensate drain was isolated and sealed, the platform tested gas-free and a fire watch posted under the hot-work permit."),
    ],
    "height": [
        ("A roofer worked beside an unguarded six-metre edge with his harness disconnected. He slipped and caught a beam.", "The roof edge had inspected guardrails and the roofer stayed connected to an approved fall-arrest anchor throughout the task."),
        ("A scaffold plank tipped under a painter at eight metres. The platform had no guardrails and the painter had no fall arrest.", "The scaffold was closed when a loose plank was found. It was repaired and inspected before the painter accessed its guarded platform."),
        ("A technician leaned from an unsecured ladder over a four-metre drop. The ladder slid and there was no fall restraint.", "A guarded access platform replaced the ladder for the task above the four-metre drop. The technician worked within its closed rails."),
        ("A worker stepped onto an open mezzanine edge carrying tools. A removed guardrail and absent restraint left a five-metre fall path.", "The mezzanine stayed closed while its guardrail was removed. Tools were moved only after the rail was reinstalled and inspected."),
        ("A worker reached across an unprotected opening in a tower deck ten metres above ground. Neither a harness nor a cover was fitted.", "The tower deck opening had a secured load-rated cover inspected before access. The worker stayed within the guarded work area."),
        ("A rigger disconnected both harness hooks while transferring between platforms at twelve metres. He lost balance and grabbed a handrail.", "During transfer the rigger maintained continuous attachment using twin lanyards on approved anchors. The guarded route was checked before access."),
    ],
    "bypassing_controls": [
        ("The high-pressure trip was bridged to keep a separator running. Pressure rose above the operating limit with operators beside it.", "The separator was shut down when its high-pressure trip failed a test. It stayed isolated until the protection was repaired and retested."),
        ("An operator taped a press guard interlock closed. A helper reached through the open guard while the ram cycled.", "The guard interlock was tested and stopped the ram on opening. The press was locked out before the helper accessed the tooling."),
        ("A crane overload limiter was disconnected for an excessive lift. The crane tilted with a rigger beside the suspended load.", "The overload limiter stopped the attempted lift. The load stayed on the ground until a correctly rated crane was arranged."),
        ("The burner flame-failure trip was overridden. Unburned gas accumulated in the furnace with operators on the adjacent platform.", "The burner was isolated after the flame-failure trip activated. The furnace was purged and its protection proved before restart."),
        ("A relief device was gagged to stop nuisance releases. The live vessel overheated and bulged while a worker took readings alongside it.", "The vessel was depressurised and isolated before servicing its relief device. Certified protection was restored before repressurisation."),
        ("A machine guard switch was defeated with a spare actuator. The conveyor ran with its guard open as a cleaner reached towards the sprocket.", "The spare actuator was removed before anyone could bypass the guard. The conveyor stayed electrically locked throughout cleaning."),
    ],
    "line_of_fire": [
        ("A tensioned wire rope snapped across a worker's chest. He had been standing inside the recoil zone.", "Workers cleared the recoil zone before tensioning. Barriers prevented access and tension was released before inspection."),
        ("A technician stood in front of a pipe test plug when it ejected at 120 bar. No restraint was fitted.", "The test plug was restrained and its discharge path barricaded. Nobody entered until draining and zero-pressure verification were complete."),
        ("A mooring line parted while a deckhand stood in its snap-back path. The rope struck the railing beside his head.", "The mooring snap-back path stayed empty during tensioning. The deckhand worked from a protected control position."),
        ("Heavy pipes rolled towards a worker after their end restraint was removed. He was standing downhill of the stack.", "The pipe stack had rated stops and chocks. The worker stayed on the protected side while remote handling equipment moved a pipe."),
        ("A compressed-air coupling separated and the loose hose lashed across an occupied walkway. It had no whip restraint.", "The hose was drained before its coupling was inspected. A rated whip restraint was fitted and pedestrians excluded during pressure testing."),
        ("A worker stood between a moving excavator counterweight and a steel column. Slewing narrowly missed crushing him.", "The excavator was stopped and its slew locked before anyone entered the counterweight envelope. Access stayed barricaded during operation."),
    ],
    "work_authorisation": [
        ("Excavation crossed a live gas main without service locating or a dig permit. The bucket struck the pipe.", "Excavation waited until services were located, marked and a dig permit issued. Supervised hand digging exposed the line before machinery approached."),
        ("A crew opened a live flange after the permit expired. Isolation was unconfirmed and hot oil sprayed towards the crew.", "The expired permit stopped the flange job. Work resumed after a new permit, verified isolation, draining and zero-pressure checks."),
        ("A night crew broke containment on the wrong line under a permit for other equipment. Pressurised gas escaped around the workers.", "The crew matched equipment tags with the permit issuer, verified isolation and pressure release, then opened the specified line."),
        ("A cold-maintenance crew changed to flame cutting beside a live fuel line without revising its permit or assessment.", "The scope change stopped work. The fuel line was isolated and a new hot-work permit issued after gas testing."),
        ("A trench was dug through a high-voltage cable route using an old drawing and no authorisation. The bucket severed a live cable beside the banksman.", "Excavation waited for current drawings, detection and trial holes to confirm the cable position. The permit specified exclusion distances before digging began."),
        ("A shift change removed a line isolation while the incoming crew continued an open-line task under an unrevalidated permit. Hydrocarbon reached the open end.", "The open-line task stopped at shift change. The crew and issuer revalidated the permit and independently checked isolation before restarting."),
    ],
}

SPLITS = ("train", "train", "calibration", "validation", "test", "test")


def scenarios():
    rows = []
    for family, pairs in PAIRS.items():
        if len(pairs) != len(SPLITS):
            raise ValueError(f"{family}: needs six scenario pairs")
        for index, ((positive, controlled), split) in enumerate(zip(pairs, SPLITS), 1):
            for label, text in ((1, positive), (0, controlled)):
                rows.append(dict(record_id=f"DEV-{family}-{index}-{label}",
                    event_group=f"DEV-{family}-{index}", description=text,
                    label=str(label), split=split, family=family,
                    is_synthetic="true", hse_reviewed="false",
                    label_origin="ASSISTANT_AUTHORED_PROTOTYPE_EXPECTATION"))
    return rows
