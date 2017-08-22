package com.qmatic.cloud.servicecontrollers;

import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.hibernate.Session;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Aspect
@Component
public class ServiceAspect {

  private final Logger log = LoggerFactory.getLogger(this.getClass());

  // only applicable to user service
  @Before("execution(* com.qmatic.cloud.servicecontrollers.SubscriptionService.*(..)) && target(subscriptionService)")
  public void aroundExecution(JoinPoint pjp, SubscriptionService subscriptionService) throws Throwable {
    org.hibernate.Filter filter = subscriptionService.getEntityManager().unwrap(Session.class).enableFilter("tenantFilter");
    filter.setParameter("tenantId", TenantContext.getCurrentTenant());
    filter.validate();
  }
}
