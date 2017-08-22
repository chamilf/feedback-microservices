package com.qmatic.cloud.servicecontrollers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import java.util.ArrayList;
import java.util.Collection;

@Service
public class SubscriptionServiceImpl implements SubscriptionService {

    @Autowired
    private SubscriptionRepository subscriptionRepository;

    @PersistenceContext
    public EntityManager entityManager;

    @Override
    public EntityManager getEntityManager() {
        return entityManager;
    }

    @Override
    public Collection<Subscription> getSubscriptions() {
        Collection<Subscription> subscriptions = new ArrayList<>();
        subscriptionRepository.findAll().forEach(subscriptions::add);
        return subscriptions;
    }

    @Override
    public Subscription getSubscriptionById(long id) {
        return subscriptionRepository.findOne(id);
    }

    @Override
    public Subscription saveOrUpdate(Subscription subscription) {
        return subscriptionRepository.save(subscription);
    }

    @Override
    public void deleteSubscription(long id) {
        subscriptionRepository.delete(id);
    }
}
