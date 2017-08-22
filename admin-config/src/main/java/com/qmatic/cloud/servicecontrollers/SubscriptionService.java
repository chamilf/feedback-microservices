package com.qmatic.cloud.servicecontrollers;

import org.springframework.stereotype.Service;

import javax.persistence.EntityManager;
import java.util.Collection;

public interface SubscriptionService {

    EntityManager getEntityManager();
    Collection<Subscription> getSubscriptions();
    Subscription getSubscriptionById(long id);
    Subscription saveOrUpdate(Subscription Question);
    void deleteSubscription(long id);
}
