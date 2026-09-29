package com.infrawatch.controller;

import com.infrawatch.repository.AgencyRepository;
import com.infrawatch.repository.MinistryRepository;
import com.infrawatch.repository.SectorRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Comparator;
import java.util.List;
import java.util.Map;

/**
 * Read-only reference data used to populate project forms.
 *
 * <p>The sector, ministry and agency lists were previously hard-coded in the
 * frontend. That guaranteed drift as soon as an agency was renamed in the
 * database, and it silently allowed submissions of agency ids that do not exist.
 */
@RestController
@RequestMapping("/v1/reference")
public class ReferenceDataController {

    private final MinistryRepository ministryRepository;
    private final SectorRepository sectorRepository;
    private final AgencyRepository agencyRepository;

    public ReferenceDataController(MinistryRepository ministryRepository,
                                   SectorRepository sectorRepository,
                                   AgencyRepository agencyRepository) {
        this.ministryRepository = ministryRepository;
        this.sectorRepository = sectorRepository;
        this.agencyRepository = agencyRepository;
    }

    @GetMapping("/ministries")
    public List<Option> ministries() {
        return ministryRepository.findAll().stream()
                .map(m -> new Option(m.getId(), m.getCode(), m.getName()))
                .sorted(Comparator.comparing(o -> o.name))
                .toList();
    }

    @GetMapping("/sectors")
    public List<Option> sectors() {
        return sectorRepository.findAll().stream()
                .map(s -> new Option(s.getId(), s.getCode(), s.getName()))
                .sorted(Comparator.comparing(o -> o.name))
                .toList();
    }

    /**
     * Agencies optionally narrowed to one ministry. Filtered lookup matters
     * because a form that lists every agency forces the user to cross-reference
     * ministries by hand.
     */
    @GetMapping("/agencies")
    public List<Option> agencies(Long ministryId) {
        return agencyRepository.findAll().stream()
                .filter(a -> ministryId == null || ministryId.equals(a.getMinistryId()))
                .map(a -> new Option(a.getId(), a.getCode(), a.getName(), a.getMinistryId()))
                .sorted(Comparator.comparing(o -> o.name))
                .toList();
    }

    @GetMapping("/all")
    public Map<String, Object> all() {
        return Map.of(
                "ministries", ministries(),
                "sectors", sectors(),
                "agencies", agencies(null));
    }

    public record Option(Long id, String code, String name, Long ministryId) {
        public Option(Long id, String code, String name) {
            this(id, code, name, null);
        }
    }
}
