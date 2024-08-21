/* global NAF */
import { Component, createEffect, createMemo, createSignal, onCleanup, onMount, Show, untrack } from 'solid-js';
import { BsCameraVideo, BsCameraVideoOff } from 'solid-icons/bs';

const savedCameraEnabled = localStorage.getItem('cameraEnabled');
export const [cameraEnabled, setCameraEnabled] = createSignal(savedCameraEnabled === 'true');
const [isConnected, setIsConnected] = createSignal(false);

export const [videoEnabled, setVideoEnabled] = createSignal(false);

const [domContentLoaded, setDomContentLoaded] = createSignal(false);