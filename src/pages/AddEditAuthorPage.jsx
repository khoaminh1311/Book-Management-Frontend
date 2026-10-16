import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../hooks/useToast';
import { useUnsavedChangesWarning } from '../hooks/useUnsavedChangesWarning';
import Breadcrumb from '../components/common/Breadcrumb';

const INITIAL_AUTHOR_FORM = {
  name: '',
  nationality: '',
  birthYear: '',
  bio: '',
};

export default function AddEditAuthorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const isEdit = Boolean(id);

  // Form State & Clean Baseline Snapshot
  const [formData, setFormData] = useState(INITIAL_AUTHOR_FORM);
  const [initialData, setInitialData] = useState(INITIAL_AUTHOR_FORM);
  const [isSaved, setIsSaved] = useState(false);

  const [formErrors, setFormErrors] = useState({});
  const [loadingAuthor, setLoadingAuthor] = useState(isEdit);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load author details in Edit mode
  useEffect(() => {
    if (isEdit) {
      let isMounted = true;
      const fetchAuthor = async () => {
        try {
          setLoadingAuthor(true);
          const res = await api.getAuthor(id);
          const author = res?.data || res;
          if (isMounted && author) {
            const loaded = {
              name: author.name || '',
              nationality: author.nationality || '',
              birthYear: author.birthYear != null ? String(author.birthYear) : '',
              bio: author.bio || '',
            };
            setFormData(loaded);
            setInitialData(loaded);
          }
        } catch (err) {
          if (isMounted) {
            showToast(err.message || 'Failed to load author profile', 'error');
            navigate('/authors');
          }
        } finally {
          if (isMounted) setLoadingAuthor(false);
        }
      };

      fetchAuthor();
      return () => {
        isMounted = false;
      };
    }
  }, [id, isEdit, navigate, showToast]);

  // Determine if form has unsaved modifications
  const isDirty = useMemo(() => {
    if (loadingAuthor || isSubmitting || isSaved) return false;
    if (!initialData) return false;

    const nameChanged = (formData.name || '').trim() !== (initialData.name || '').trim();
    const nationalityChanged =
      (formData.nationality || '').trim() !== (initialData.nationality || '').trim();
    const birthYearChanged =
      String(formData.birthYear || '').trim() !== String(initialData.birthYear || '').trim();
    const bioChanged = (formData.bio || '').trim() !== (initialData.bio || '').trim();

    return nameChanged || nationalityChanged || birthYearChanged || bioChanged;
  }, [formData, initialData, loadingAuthor, isSubmitting, isSaved]);

  // Guard against losing unsaved changes
  const { handleCancel } = useUnsavedChangesWarning(isDirty);

  // Input Change Handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Client-side Validation (matches authorModel schema & Figma constraints)
  const validateForm = () => {
    const errors = {};

    // Author Name: Required, max 100 chars
    if (!formData.name.trim()) {
      errors.name = 'Author Full Name is required';
    } else if (formData.name.trim().length > 100) {
      errors.name = 'Author name cannot exceed 100 characters';
    }

    // Birth Year: Optional, but if provided must be positive integer and <= current year
    if (formData.birthYear) {
      const yearNum = Number(formData.birthYear);
      const currentYear = new Date().getFullYear();
      if (!Number.isInteger(yearNum) || yearNum <= 0) {
        errors.birthYear = 'Birth year must be a positive integer';
      } else if (yearNum > currentYear) {
        errors.birthYear = `Birth year cannot exceed current year (${currentYear})`;
      }
    }

    // Bio: Required in Figma UI (*), max 2000 chars
    if (!formData.bio.trim()) {
      errors.bio = 'Author biography is required';
    } else if (formData.bio.trim().length > 2000) {
      errors.bio = 'Biography cannot exceed 2000 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Form Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      const payload = {
        name: formData.name.trim(),
        nationality: formData.nationality.trim(),
        bio: formData.bio.trim(),
        birthYear: formData.birthYear ? Number(formData.birthYear) : null,
      };

      if (isEdit) {
        await api.updateAuthor(id, payload);
        showToast('Author profile updated successfully', 'success');
        setIsSaved(true);
        navigate(`/authors/${id}`);
      } else {
        const res = await api.createAuthor(payload);
        showToast('Author added to collection successfully', 'success');
        setIsSaved(true);
        const newId = res?.data?._id || res?._id;
        navigate(newId ? `/authors/${newId}` : '/authors');
      }
    } catch (err) {
      showToast(err.message || 'Failed to save author', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingAuthor) {
    return (
      <div className="p-8 lg:p-12 max-w-7xl w-full mx-auto flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="text-sm text-on-surface-variant font-sans">
          Loading Author Archival Profile...
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-7xl w-full mx-auto flex flex-col gap-6 sm:gap-8">
      {/* 2. Editorial Header Banner (Figma #1:1150 - #1:1156) */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-4">
        <div>
          <Breadcrumb
            items={[
              { label: 'Authors', to: '/authors' },
              { label: isEdit ? 'Edit Author' : 'Add New Author' },
            ]}
            className="mb-1.5"
          />
          <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-primary font-normal tracking-tight break-words">
            {isEdit ? 'Edit Author Profile' : 'Add New Author'}
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1 max-w-xl font-sans">
            Enter author biography and details to link with catalog volumes, reading metrics, and
            editorial archives.
          </p>
        </div>
      </div>

      {/* 3. Main Two-Column Editorial Workspace -> Form (Figma #1:1157 - #1:1218) */}
      <div className="w-full flex justify-center">
        <form
          onSubmit={handleSubmit}
          noValidate
          className="w-full max-w-[672px] bg-white p-5 sm:p-8 rounded-[12px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] flex flex-col gap-6 sm:gap-7"
        >
          {/* Field 1: Author Full Name (Figma #1:1158 - #1:1169) */}
          <div className="flex flex-col gap-1.5 sm:gap-2">
            <div className="flex items-center justify-between text-sm font-sans">
              <label
                htmlFor="author-name"
                className="font-semibold text-xs sm:text-[14px] leading-[20px] text-[#1A1C1B]"
              >
                Author Full Name <span className="text-[#BA1A1A] font-normal">*</span>
              </label>
              <span className="font-semibold text-[10px] sm:text-[11px] leading-[14px] tracking-[0.05em] text-[#45474C]">
                {formData.name.length} / 100
              </span>
            </div>

            <div className="relative flex items-center">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#45474C] pointer-events-none flex items-center justify-center">
                <svg
                  className="w-[13px] h-[13px] text-[#45474C] fill-current opacity-60"
                  viewBox="0 0 13 13"
                >
                  <path d="M6.50001 6.50001C5.60625 6.50001 4.84115 6.18178 4.20469 5.54532C3.56823 4.90886 3.25 4.14375 3.25 3.25C3.25 2.35625 3.56823 1.59115 4.20469 0.954688C4.84115 0.318229 5.60625 0 6.50001 0C7.39376 0 8.15886 0.318229 8.79532 0.954688C9.43178 1.59115 9.75001 2.35625 9.75001 3.25C9.75001 4.14375 9.43178 4.90886 8.79532 5.54532C8.15886 6.18178 7.39376 6.50001 6.50001 6.50001ZM0 13V10.725C0 10.2646 0.11849 9.84141 0.355469 9.45548C0.592448 9.06954 0.907292 8.77501 1.3 8.57188C2.13959 8.15209 2.99271 7.83725 3.85938 7.62735C4.72605 7.41745 5.60625 7.31251 6.50001 7.31251C7.39376 7.31251 8.27397 7.41745 9.14063 7.62735C10.0073 7.83725 10.8604 8.15209 11.7 8.57188C12.0927 8.77501 12.4076 9.06954 12.6445 9.45548C12.8815 9.84141 13 10.2646 13 10.725V13H0ZM1.625 11.375H11.375V10.725C11.375 10.5761 11.3378 10.4406 11.2633 10.3188C11.1888 10.1969 11.0906 10.1021 10.9688 10.0344C10.2375 9.66876 9.49949 9.39454 8.75469 9.21173C8.0099 9.02891 7.25834 8.93751 6.50001 8.93751C5.74167 8.93751 4.99011 9.02891 4.24532 9.21173C3.50052 9.39454 2.7625 9.66876 2.03125 10.0344C1.90938 10.1021 1.8112 10.1969 1.73672 10.3188C1.66224 10.4406 1.625 10.5761 1.625 10.725V11.375ZM6.50001 4.875C6.94688 4.875 7.32943 4.71589 7.64766 4.39766C7.96589 4.07943 8.12501 3.69688 8.12501 3.25C8.12501 2.80313 7.96589 2.42058 7.64766 2.10235C7.32943 1.78412 6.94688 1.625 6.50001 1.625C6.05313 1.625 5.67058 1.78412 5.35235 2.10235C5.03412 2.42058 4.875 2.80313 4.875 3.25C4.875 3.69688 5.03412 4.07943 5.35235 4.39766C5.67058 4.71589 6.05313 4.875 6.50001 4.875Z" />
                </svg>
              </span>
              <input
                id="author-name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                maxLength={100}
                placeholder="Elena Rostova"
                className={`w-full pl-9 pr-4 py-2.5 rounded-lg bg-[#F4F3F1] border ${formErrors.name ? 'border-error ring-1 ring-error' : 'border-transparent'
                  } text-sm text-[#1A1C1B] placeholder:text-[#45474C]/50 focus:outline-none focus:ring-2 focus:ring-[#091426]/20 transition-all font-sans`}
              />
            </div>
            {formErrors.name && (
              <p className="text-xs text-error font-sans mt-0.5">{formErrors.name}</p>
            )}
          </div>

          {/* Fields 2 & 3: Nationality & Birth Year (Figma #1:1170 - #1:1196) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {/* Nationality */}
            <div className="flex flex-col gap-1.5 sm:gap-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="author-nationality"
                  className="font-semibold text-xs sm:text-[14px] leading-[20px] text-[#1A1C1B] font-sans"
                >
                  Nationality
                </label>
                <span className="text-[10px] sm:text-[11px] font-semibold text-[#45474C] uppercase tracking-wider font-sans">
                  DEMONYM
                </span>
              </div>

              <div className="relative flex items-center">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#45474C] pointer-events-none flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-[#45474C] fill-current opacity-60"
                    viewBox="0 0 16 16"
                  >
                    <path d="M7.99992 15.9998C6.89326 15.9998 5.85327 15.7898 4.87995 15.3698C3.90663 14.9498 3.05997 14.3799 2.33998 13.6599C1.61998 12.9399 1.04999 12.0932 0.629994 11.1199C0.209998 10.1466 0 9.10657 0 7.99992C0 6.89326 0.209998 5.85327 0.629994 4.87995C1.04999 3.90663 1.61998 3.05997 2.33998 2.33998C3.05997 1.61998 3.90663 1.04999 4.87995 0.629994C5.85327 0.209998 6.89326 0 7.99992 0C9.10657 0 10.1466 0.209998 11.1199 0.629994C12.0932 1.04999 12.9399 1.61998 13.6599 2.33998C14.3799 3.05997 14.9498 3.90663 15.3698 4.87995C15.7898 5.85327 15.9998 6.89326 15.9998 7.99992C15.9998 9.10657 15.7898 10.1466 15.3698 11.1199C14.9498 12.0932 14.3799 12.9399 13.6599 13.6599C12.9399 14.3799 12.0932 14.9498 11.1199 15.3698C10.1466 15.7898 9.10657 15.9998 7.99992 15.9998ZM7.19993 14.3599V12.7999C6.75993 12.7999 6.38327 12.6432 6.06994 12.3299C5.75661 12.0165 5.59994 11.6399 5.59994 11.1999V10.3999L1.75998 6.55993C1.71998 6.79993 1.68332 7.03993 1.64998 7.27993C1.61665 7.51992 1.59998 7.75992 1.59998 7.99992C1.59998 9.61323 2.12998 11.0266 3.18997 12.2399C4.24996 13.4532 5.58661 14.1599 7.19993 14.3599ZM12.7199 12.3199C13.2665 11.7199 13.6832 11.0499 13.9699 10.3099C14.2565 9.5699 14.3999 8.79991 14.3999 7.99992C14.3999 6.69326 14.0365 5.49994 13.3099 4.41995C12.5832 3.33997 11.6132 2.55997 10.3999 2.07998V2.39998C10.3999 2.83997 10.2432 3.21663 9.9299 3.52996C9.61657 3.84329 9.2399 3.99996 8.79991 3.99996H7.19993V5.59994C7.19993 5.82661 7.12326 6.0166 6.96993 6.16994C6.8166 6.32327 6.6266 6.39993 6.39993 6.39993H4.79995V7.99992H9.5999C9.82657 7.99992 10.0166 8.07658 10.1699 8.22992C10.3232 8.38325 10.3999 8.57325 10.3999 8.79991V11.1999H11.1999C11.5465 11.1999 11.8599 11.3032 12.1399 11.5099C12.4199 11.7165 12.6132 11.9865 12.7199 12.3199Z" />
                  </svg>
                </span>
                <input
                  id="author-nationality"
                  name="nationality"
                  type="text"
                  value={formData.nationality}
                  onChange={handleChange}
                  placeholder="Italian-Finnish"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#F4F3F1] border border-transparent text-sm text-[#1A1C1B] placeholder:text-[#45474C]/50 focus:outline-none focus:ring-2 focus:ring-[#091426]/20 transition-all font-sans"
                />
              </div>
            </div>

            {/* Birth Year */}
            <div className="flex flex-col gap-1.5 sm:gap-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="author-birthyear"
                  className="font-semibold text-xs sm:text-[14px] leading-[20px] text-[#1A1C1B] font-sans"
                >
                  Birth Year
                </label>
                <span className="text-[10px] sm:text-[11px] font-semibold text-[#45474C] uppercase tracking-wider font-sans">
                  CHRONOLOGY
                </span>
              </div>

              <div className="relative flex items-center">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#45474C] pointer-events-none flex items-center justify-center">
                  <svg
                    className="w-[15px] h-4 text-[#45474C] fill-current opacity-60"
                    viewBox="0 0 15 16"
                  >
                    <path d="M1.6 16C1.16 16 0.783333 15.8433 0.47 15.53C0.156667 15.2167 0 14.84 0 14.4V3.2C0 2.76 0.156667 2.38333 0.47 2.07C0.783333 1.75667 1.16 1.6 1.6 1.6H2.4V0H4V1.6H10.4V0H12V1.6H12.8C13.24 1.6 13.6167 1.75667 13.93 2.07C14.2433 2.38333 14.4 2.76 14.4 3.2V14.4C14.4 14.84 14.2433 15.2167 13.93 15.53C13.6167 15.8433 13.24 16 12.8 16H1.6ZM1.6 14.4H12.8V6.4H1.6V14.4ZM1.6 4.8H12.8V3.2H1.6V4.8ZM1.6 4.8V3.2V4.8Z" />
                  </svg>
                </span>
                <input
                  id="author-birthyear"
                  name="birthYear"
                  type="number"
                  min="0"
                  max={new Date().getFullYear()}
                  value={formData.birthYear}
                  onChange={handleChange}
                  placeholder="1978"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#F4F3F1] border ${formErrors.birthYear ? 'border-error ring-1 ring-error' : 'border-transparent'
                    } text-sm text-[#1A1C1B] placeholder:text-[#45474C]/50 focus:outline-none focus:ring-2 focus:ring-[#091426]/20 transition-all font-sans`}
                />
              </div>
              {formErrors.birthYear && (
                <p className="text-xs text-error font-sans mt-0.5">{formErrors.birthYear}</p>
              )}
            </div>
          </div>

          {/* Field 4: Biography / Bio (Figma #1:1197 - #1:1205) */}
          <div className="flex flex-col gap-1.5 sm:gap-2">
            <div className="flex items-center justify-between text-sm font-sans">
              <label
                htmlFor="author-bio"
                className="font-semibold text-xs sm:text-[14px] leading-[20px] text-[#1A1C1B]"
              >
                Biography / Bio <span className="text-[#BA1A1A] font-normal">*</span>
              </label>
              <span className="font-semibold text-[10px] sm:text-[11px] leading-[14px] tracking-[0.05em] text-[#45474C]">
                {formData.bio.length} / 2000 chars
              </span>
            </div>

            <textarea
              id="author-bio"
              name="bio"
              rows={6}
              maxLength={2000}
              value={formData.bio}
              onChange={handleChange}
              placeholder="Elena Rostova is a contemporary novelist and essayist known for her contemplative prose style and exploration of displaced identities across Nordic and Mediterranean landscapes. Her work bridges post-war architectural history with intimate interior drama, earning widespread literary recognition and international translation."
              className={`w-full p-3.5 sm:p-4 rounded-lg bg-[#F4F3F1] border ${formErrors.bio ? 'border-error ring-1 ring-error' : 'border-transparent'
                } text-xs sm:text-sm text-[#1A1C1B] placeholder:text-[#45474C]/50 focus:outline-none focus:ring-2 focus:ring-[#091426]/20 transition-all font-sans leading-relaxed resize-y min-h-[120px] sm:min-h-[140px]`}
            />
            {formErrors.bio && (
              <p className="text-xs text-error font-sans mt-0.5">{formErrors.bio}</p>
            )}
          </div>

          {/* Form Action Footer (Figma #1:1206 - #1:1218) */}
          <div className="flex items-center gap-2.5 sm:gap-3 pt-4 border-t border-[#E9E8E6] mt-1 w-full justify-between">
            <button
              type="button"
              onPointerDown={() => {
                if (
                  document.activeElement &&
                  document.activeElement !== document.body &&
                  typeof document.activeElement.blur === 'function'
                ) {
                  document.activeElement.blur();
                }
              }}
              onClick={handleCancel}
              disabled={isSubmitting}
              className="flex-1 sm:flex-initial justify-center px-4 sm:px-5 py-2.5 rounded-lg border border-[#C5C6CD] hover:bg-[#F4F3F1] text-xs sm:text-sm font-semibold text-[#1A1C1B] transition-colors flex items-center gap-2 font-sans cursor-pointer disabled:opacity-50"
            >
              <svg className="w-[11px] h-[11px] text-[#1A1C1B] fill-current" viewBox="0 0 11 11">
                <path d="M1.1 11L0 9.9L4.4 5.5L0 1.1L1.1 0L5.5 4.4L9.9 0L11 1.1L6.6 5.5L11 9.9L9.9 11L5.5 6.6L1.1 11Z" />
              </svg>
              <span>Cancel</span>
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 sm:flex-initial justify-center px-5 sm:px-6 py-2.5 rounded-lg bg-[#091426] hover:bg-[#091426]/90 text-white text-xs sm:text-sm font-semibold shadow-sm transition-colors flex items-center gap-2 font-sans disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 text-white fill-current" viewBox="0 0 16 16">
                    <path d="M6.87993 11.6799L12.5199 6.03994L11.3999 4.91995L6.87993 9.4399L4.59995 7.15993L3.47996 8.27992L6.87993 11.6799ZM7.99992 15.9998C6.89326 15.9998 5.85327 15.7898 4.87995 15.3698C3.90663 14.9498 3.05997 14.3799 2.33998 13.6599C1.61998 12.9399 1.04999 12.0932 0.629994 11.1199C0.209998 10.1466 0 9.10657 0 7.99992C0 6.89326 0.209998 5.85327 0.629994 4.87995C1.04999 3.90663 1.61998 3.05997 2.33998 2.33998C3.05997 1.61998 3.90663 1.04999 4.87995 0.629994C5.85327 0.209998 6.89326 0 7.99992 0C9.10657 0 10.1466 0.209998 11.1199 0.629994C12.0932 1.04999 12.9399 1.61998 13.6599 2.33998C14.3799 3.05997 14.9498 3.90663 15.3698 4.87995C15.7898 5.85327 15.9998 6.89326 15.9998 7.99992C15.9998 9.10657 15.7898 10.1466 15.3698 11.1199C14.9498 12.0932 14.3799 12.9399 13.6599 13.6599C12.9399 14.3799 12.0932 14.9498 11.1199 15.3698C10.1466 15.7898 9.10657 15.9998 7.99992 15.9998ZM7.99992 14.3999C9.78657 14.3999 11.2999 13.7799 12.5399 12.5399C13.7799 11.2999 14.3999 9.78657 14.3999 7.99992C14.3999 6.21327 13.7799 4.69995 12.5399 3.45996C11.2999 2.21998 9.78657 1.59998 7.99992 1.59998C6.21327 1.59998 4.69995 2.21998 3.45996 3.45996C2.21998 4.69995 1.59998 6.21327 1.59998 7.99992C1.59998 9.78657 2.21998 11.2999 3.45996 12.5399C4.69995 13.7799 6.21327 14.3999 7.99992 14.3999Z" />
                  </svg>
                  <span>{isEdit ? 'Update Author' : 'Save Author'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
