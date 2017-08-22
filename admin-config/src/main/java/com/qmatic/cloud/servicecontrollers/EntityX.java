package com.qmatic.cloud.servicecontrollers;
 
import javax.persistence.*;

@Entity 
public class EntityX {

	private long id;
	
    private String name;
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public long getId() {
		return id;
	}
	public void setId(long id) {
		this.id = id;
	}

    public String getName() {
		return name;
	}
	public void setName(String name) {
		this.name = name;
	}

}