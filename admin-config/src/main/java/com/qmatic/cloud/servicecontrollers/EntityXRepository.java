package com.qmatic.cloud.servicecontrollers;
 
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

@RepositoryRestResource
public interface EntityXRepository extends CrudRepository<EntityX, Long> {
 	
}
