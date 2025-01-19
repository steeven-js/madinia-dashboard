import { useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

import { paths } from 'src/routes/paths';

import { useAuth } from 'src/hooks/use-auth';

export function ProfileGuard({ children }) {
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  const isProfileComplete = useCallback(() => {
    if (!userProfile) return false;

    const requiredFields = [
      'address',
      'city',
      'company',
      'country',
      'phoneNumber',
      'state',
      'zipCode',
    ];

    return requiredFields.every((field) => !!userProfile[field]);
  }, [userProfile]);

  useEffect(() => {
    if (userProfile && !isProfileComplete()) {
      navigate(paths.dashboard.completeProfile);
    }
  }, [userProfile, navigate, isProfileComplete]);

  if (!userProfile) {
    return null;
  }

  return children;
}

ProfileGuard.propTypes = {
  children: PropTypes.node,
};
