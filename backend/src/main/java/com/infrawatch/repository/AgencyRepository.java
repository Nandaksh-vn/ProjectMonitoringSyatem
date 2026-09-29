package com.infrawatch.repository;

import com.infrawatch.entity.Agency;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AgencyRepository extends JpaRepository<Agency, Long> {

    List<Agency> findByMinistryId(Long ministryId);

    Optional<Agency> findByCode(String code);
}
