<?php

declare(strict_types = 1);

namespace Drupal\repeat_mapbox\Form;

use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;

/**
 * Configure Repeat mapbox settings for this site.
 */
class MapboxSettingsForm extends ConfigFormBase {

  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'repeat_mapbox_mapbox_settings';
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state) {
    $config = $this->config('repeat_mapbox.settings');
    $form['token'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Mapbox Access Token'),
      '#default_value' => $config->get('token'),
      '#required' => TRUE,
    ];
    $form['url'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Mapbox Base Map URL'),
      '#default_value' => $config->get('url'),
      '#required' => TRUE,
      '#description' => $this->t('A Mapbox map url. ex: mapbox://styles/mapbox/streets-v11'),
    ];
    return parent::buildForm($form, $form_state);
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    $this->config('repeat_mapbox.settings')
      ->set('token', $form_state->getValue('token'))
      ->set('url', $form_state->getValue('url'))
      ->save();
    parent::submitForm($form, $form_state);
  }

  /**
   * {@inheritdoc}
   */
  protected function getEditableConfigNames() {
    return ['repeat_mapbox.settings'];
  }

}
